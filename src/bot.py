import os
import json
import random
import time
import traceback
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq as GroqClient
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes

from src.scoring import calculate_score

load_dotenv()

CASES_DIR = Path(__file__).parent.parent / "data" / "cases"

user_sessions: dict[int, dict] = {}
seen_cases: dict[int, list[str]] = {}

WELCOME_MSG = """👋 Welcome to Casuist!

Practice clinical reasoning through real patient cases — grounded in published medical literature.

Use /case to start a case.
Use /help to learn how it works."""

HELP_MSG = """🏥 How Casuist works:

• You'll be presented with a patient case
• Gather history, exam findings, and labs
• Rank your differential diagnoses
• Get AI feedback grounded in PubMed literature
• Receive a score for your clinical reasoning

Use /case to begin."""

FALLBACK_MSG = "Use /start to begin or /help for instructions."

DISCLAIMER = "\n\n_Educational purposes only — not a substitute for clinical training._"

SECTION_LABELS = {"history": "History", "exam": "Exam", "labs": "Labs"}

SPECIALTY_MAP: dict[str, list[str]] = {
    "Cardiology": ["chest pain", "myocardial infarction", "acute coronary syndrome", "cardiology"],
    "Respiratory": ["pulmonary embolism", "pneumonia", "COPD"],
    "Neurology": ["seizure", "stroke", "meningitis", "neurology"],
    "Endocrinology": ["diabetic ketoacidosis", "thyroid storm", "Endocrinology"],
    "Gastroenterology": ["pancreatitis", "gastrointestinal bleed", "Gastroenterology", "gastrointestinal oncology"],
}


def _build_section_keyboard(sections_viewed: list[str]) -> InlineKeyboardMarkup:
    buttons = []
    for key, label in SECTION_LABELS.items():
        if key not in sections_viewed:
            buttons.append(InlineKeyboardButton(label, callback_data=f"section_{key}"))
    rows = [[btn] for btn in buttons]
    rows.append([InlineKeyboardButton("Ready to diagnose", callback_data="ready_to_diagnose")])
    return InlineKeyboardMarkup(rows)


def _get_specialty_from_file(path: Path) -> str:
    with open(path, encoding="utf-8") as f:
        return json.load(f).get("specialty", "")


async def _start_case(user_id: int, send_fn, specialty: str | None = None) -> None:
    case_files = list(CASES_DIR.glob("*.json"))
    if not case_files:
        await send_fn("No cases available. Please check data/cases/.")
        return

    if specialty:
        allowed_values = [v.lower() for v in SPECIALTY_MAP.get(specialty, [])]
        case_files = [
            f for f in case_files
            if _get_specialty_from_file(f).lower() in allowed_values
        ]
        if not case_files:
            await send_fn(f"No cases found for {specialty}. Try another specialty.")
            return

    user_seen = seen_cases.get(user_id, [])
    unseen = [f for f in case_files if f.stem not in user_seen]
    if not unseen:
        seen_cases[user_id] = []
        unseen = case_files

    case_path = random.choice(unseen)
    with open(case_path, encoding="utf-8") as f:
        case = json.load(f)

    seen_cases.setdefault(user_id, []).append(case_path.stem)

    user_sessions[user_id] = {
        "case": case,
        "sections_viewed": [],
        "start_time": time.time(),
        "state": "gathering_info",
        "case_message_id": None,
    }

    keyboard = _build_section_keyboard([])
    msg = await send_fn(
        f"🏥 *New Case*\n\n{case['chief_complaint']}",
        reply_markup=keyboard,
        parse_mode="Markdown",
    )
    user_sessions[user_id]["case_message_id"] = msg.message_id


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(WELCOME_MSG)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(HELP_MSG)


async def case_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    rows = [[InlineKeyboardButton(s, callback_data=f"specialty_{s}")] for s in SPECIALTY_MAP]
    keyboard = InlineKeyboardMarkup(rows)
    await update.message.reply_text("Choose a specialty:", reply_markup=keyboard)


async def specialty_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    specialty = query.data.replace("specialty_", "")
    user_id = query.from_user.id
    user_sessions[user_id] = {"specialty": specialty}
    await _start_case(user_id, query.message.reply_text, specialty=specialty)


async def section_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    if user_id not in user_sessions:
        await query.message.reply_text("No active case. Use /case to start.")
        return

    session = user_sessions[user_id]
    section = query.data.replace("section_", "")

    if section in session["sections_viewed"]:
        return

    session["sections_viewed"].append(section)
    content = session["case"].get(section, "Section not available.")
    label = SECTION_LABELS[section]

    await query.message.reply_text(f"*{label}*\n\n{content}", parse_mode="Markdown")

    new_keyboard = _build_section_keyboard(session["sections_viewed"])
    await query.message.edit_reply_markup(reply_markup=new_keyboard)


def _build_ranking_keyboard(remaining: list[str]) -> InlineKeyboardMarkup:
    rows = [[InlineKeyboardButton(dx, callback_data=f"dx_{i}")] for i, dx in enumerate(remaining)]
    return InlineKeyboardMarkup(rows)


def generate_feedback(case: dict, user_ranking: list[str], correct_ranking: list[str]) -> str:
    """Call Groq directly to generate educational feedback after scoring."""
    ranked_lines = "\n".join(
        f"  #{i+1}: {dx}" for i, dx in enumerate(user_ranking)
    )
    correct_lines = "\n".join(
        f"  #{i+1}: {dx}" for i, dx in enumerate(correct_ranking)
    )
    prompt = (
        f"Case: {case.get('chief_complaint', '')}\n\n"
        f"History: {case.get('history', '')}\n\n"
        f"Exam: {case.get('exam', '')}\n\n"
        f"Labs: {case.get('labs', '')}\n\n"
        f"Correct diagnosis: {case.get('correct_diagnosis', '')}\n\n"
        f"Student's ranking:\n{ranked_lines}\n\n"
        f"Correct ranking:\n{correct_lines}\n\n"
        "In under 250 words, explain: (1) why the correct diagnosis fits this case, "
        "(2) which clinical clues were most important, "
        "(3) why the top differentials were plausible but less likely. "
        "Be concise and educational. Do not invent citations or PMIDs."
    )
    try:
        client = GroqClient(api_key=os.getenv("GROQ_API_KEY"))
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=400,
        )
        result = response.choices[0].message.content.strip()
        print(f"[generate_feedback] response:\n{result}\n")
        return result
    except Exception as e:
        traceback.print_exc()
        return f"Feedback unavailable: {e}"


def _build_scorecard(score: dict, user_ranking: list[str], correct_ranking: list[str]) -> str:
    ordinals = ["#1", "#2", "#3", "#4", "#5"]
    lines = [f"📊 *Case Complete!*\n\n*Score: {score['total']}/100 — Grade {score['grade']}*\n"]
    for i, (user_pick, correct_pick) in enumerate(zip(user_ranking, correct_ranking)):
        icon = "✅" if user_pick == correct_pick else "❌"
        if user_pick == correct_pick:
            lines.append(f"{icon} {ordinals[i]}: {user_pick}")
        else:
            lines.append(f"{icon} {ordinals[i]}: You said _{user_pick}_\n        Answer: *{correct_pick}*")
    lines.append(f"\n🎯 Accuracy: {score['accuracy_score']}/40")
    lines.append(f"📋 Ranking: {score['ranking_score']}/30")
    lines.append(f"⚡ Efficiency: {score['efficiency_score']}/20")
    lines.append(f"⏱ Speed: {score['speed_score']}/10")
    return "\n".join(lines)


async def diagnose_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    if user_id not in user_sessions:
        await query.message.reply_text("No active case. Use /case to start.")
        return

    session = user_sessions[user_id]
    session["state"] = "ranking"
    session["user_ranking"] = []
    session["remaining_options"] = list(session["case"]["differentials"])

    keyboard = _build_ranking_keyboard(session["remaining_options"])
    await query.message.reply_text(
        "🔍 *Rank the diagnoses from most to least likely.*\n\nPick your *#1* diagnosis:",
        reply_markup=keyboard,
        parse_mode="Markdown",
    )


async def dx_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    if user_id not in user_sessions:
        await query.message.reply_text("No active case. Use /case to start.")
        return

    session = user_sessions[user_id]
    idx = int(query.data.replace("dx_", ""))
    selected = session["remaining_options"][idx]

    session["user_ranking"].append(selected)
    session["remaining_options"].pop(idx)

    rank_num = len(session["user_ranking"])

    if rank_num < 5:
        next_num = rank_num + 1
        ordinals = {2: "2nd", 3: "3rd", 4: "4th", 5: "5th"}
        keyboard = _build_ranking_keyboard(session["remaining_options"])
        await query.message.reply_text(
            f"✅ *#{rank_num}:* {selected}\nNow pick your *#{next_num}* ({ordinals[next_num]} most likely):",
            reply_markup=keyboard,
            parse_mode="Markdown",
        )
    else:
        # All 5 ranked — show confirmation before scoring
        ranking_lines = "\n".join(
            f"*#{i+1}:* {dx}" for i, dx in enumerate(session["user_ranking"])
        )
        confirm_keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("✅ Confirm & Score", callback_data="confirm_score")],
            [InlineKeyboardButton("🔄 Start Over", callback_data="start_over")],
        ])
        await query.message.reply_text(
            f"📋 *Your ranking:*\n{ranking_lines}",
            reply_markup=confirm_keyboard,
            parse_mode="Markdown",
        )


async def confirm_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    if user_id not in user_sessions:
        await query.message.reply_text("No active case. Use /case to start.")
        return

    session = user_sessions[user_id]
    correct_ranking = session["case"].get("correct_ranking", [])
    score = calculate_score(
        correct_ranking=correct_ranking,
        student_ranking=session["user_ranking"],
        sections_viewed=session["sections_viewed"],
        time_taken_seconds=time.time() - session["start_time"],
    )
    scorecard = _build_scorecard(score, session["user_ranking"], correct_ranking)
    post_score_keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("🧠 Get Clinical Feedback", callback_data="get_feedback")],
        [InlineKeyboardButton("🔄 New Case", callback_data="new_case")],
    ])
    await query.message.reply_text(
        scorecard + DISCLAIMER,
        reply_markup=post_score_keyboard,
        parse_mode="Markdown",
    )
    session["correct_ranking"] = correct_ranking


async def start_over_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    if user_id not in user_sessions:
        await query.message.reply_text("No active case. Use /case to start.")
        return

    session = user_sessions[user_id]
    reshuffled = list(session["case"]["differentials"])
    random.shuffle(reshuffled)
    session["user_ranking"] = []
    session["remaining_options"] = reshuffled

    keyboard = _build_ranking_keyboard(session["remaining_options"])
    await query.message.reply_text(
        "🔍 *Rank the diagnoses from most to least likely.*\n\nPick your *#1* diagnosis:",
        reply_markup=keyboard,
        parse_mode="Markdown",
    )


async def feedback_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    user_id = query.from_user.id
    if user_id not in user_sessions:
        await query.message.reply_text("Session expired. Use /case to start a new case.")
        return

    session = user_sessions[user_id]
    await query.message.reply_text("⏳ Generating feedback...")

    feedback = generate_feedback(
        session["case"],
        session["user_ranking"],
        session["correct_ranking"],
    )
    new_case_keyboard = InlineKeyboardMarkup(
        [[InlineKeyboardButton("🔄 New Case", callback_data="new_case")]]
    )
    await query.message.reply_text(
        f"🧠 *Clinical Reasoning Feedback*\n\n{feedback}",
        reply_markup=new_case_keyboard,
        parse_mode="Markdown",
    )
    user_sessions.pop(user_id, None)


async def new_case_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    user_sessions.pop(query.from_user.id, None)
    rows = [[InlineKeyboardButton(s, callback_data=f"specialty_{s}")] for s in SPECIALTY_MAP]
    keyboard = InlineKeyboardMarkup(rows)
    await query.message.reply_text("Choose a specialty:", reply_markup=keyboard)


async def fallback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(FALLBACK_MSG)


def main() -> None:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    if not token:
        raise ValueError("TELEGRAM_BOT_TOKEN not set in .env")

    app = Application.builder().token(token).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("case", case_command))
    app.add_handler(CallbackQueryHandler(specialty_callback, pattern="^specialty_"))
    app.add_handler(CallbackQueryHandler(section_callback, pattern="^section_"))
    app.add_handler(CallbackQueryHandler(diagnose_callback, pattern="^ready_to_diagnose$"))
    app.add_handler(CallbackQueryHandler(dx_callback, pattern="^dx_"))
    app.add_handler(CallbackQueryHandler(confirm_callback, pattern="^confirm_score$"))
    app.add_handler(CallbackQueryHandler(start_over_callback, pattern="^start_over$"))
    app.add_handler(CallbackQueryHandler(feedback_callback, pattern="^get_feedback$"))
    app.add_handler(CallbackQueryHandler(new_case_callback, pattern="^new_case$"))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, fallback))

    print("Casuist bot is running...")
    app.run_polling()


if __name__ == "__main__":
    main()
