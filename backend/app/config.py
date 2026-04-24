from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "BitBingo API"
    database_url: str = "sqlite:///./bitbingo.db"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


settings = Settings()
