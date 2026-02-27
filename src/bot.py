import os
from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

load_dotenv()

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

CASE_MSG = "🚧 Cases coming soon. Bot is being set up."

FALLBACK_MSG = "Use /start to begin or /help for instructions."


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(WELCOME_MSG)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(HELP_MSG)


async def case_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(CASE_MSG)


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
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, fallback))

    print("Casuist bot is running...")
    app.run_polling()


if __name__ == "__main__":
    main()
