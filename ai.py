import os

import requests

from dotenv import load_dotenv


# Load variables from the .env file
load_dotenv()


# Get AI settings from .env
API_URL = os.getenv("AI_API_URL")
API_KEY = os.getenv("AI_API_KEY")
AI_MODEL = os.getenv("AI_MODEL")


def generate_response(messages):
    """
    Send the conversation messages to the AI provider
    and return the AI's text response.
    """

    # Check that the API URL exists
    if not API_URL:
        raise RuntimeError(
            "AI_API_URL is missing from your .env file."
        )

    # Check that the API key exists
    if not API_KEY:
        raise RuntimeError(
            "AI_API_KEY is missing from your .env file."
        )

    # Check that a model exists
    if not AI_MODEL:
        raise RuntimeError(
            "AI_MODEL is missing from your .env file."
        )

    # Make sure messages is a list
    if not isinstance(messages, list):
        raise ValueError(
            "messages must be a list."
        )

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": AI_MODEL,
        "messages": messages,
        "stream": False
    }

    try:
        response = requests.post(
            API_URL,
            headers=headers,
            json=payload,
            timeout=120
        )

        response.raise_for_status()

    except requests.exceptions.Timeout:
        raise RuntimeError(
            "The AI service took too long to respond."
        )

    except requests.exceptions.RequestException as error:

        error_message = ""

        try:
            error_message = response.text[:1000]
        except Exception:
            pass

        raise RuntimeError(
            f"AI API request failed: {error}"
            + (
                f"\nProvider response: {error_message}"
                if error_message
                else ""
            )
        )

    # Convert the response into JSON
    try:
        data = response.json()
    except ValueError:
        raise RuntimeError(
            "The AI provider returned an invalid response."
        )

    # Extract the assistant's response
    try:
        result = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):

        # Some providers use output_text
        result = data.get("output_text")

    if not result:
        raise RuntimeError(
            "The AI provider returned an empty response."
        )

    # Some APIs can return content as a list
    if isinstance(result, list):

        text_parts = []

        for item in result:

            if isinstance(item, dict):

                text = item.get("text")

                if text:
                    text_parts.append(str(text))

            elif isinstance(item, str):

                text_parts.append(item)

        result = "".join(text_parts)

    return str(result).strip()