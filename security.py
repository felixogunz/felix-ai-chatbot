from config import (
    ALLOWED_EXTENSIONS,
    MAX_FILE_SIZE
)


def allowed_file(filename):

    if not filename:
        return False

    if "." not in filename:
        return False

    extension = (
        filename.rsplit(
            ".",
            1
        )[1]
        .lower()
    )

    return extension in ALLOWED_EXTENSIONS


def validate_file_size(file):

    file.seek(
        0,
        2
    )

    size = file.tell()

    file.seek(0)

    return (
        size <= MAX_FILE_SIZE,
        size
    )