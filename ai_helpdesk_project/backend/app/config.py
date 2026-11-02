from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://helpdesk:helpdesk123@db:5432/helpdesk"
    jwt_secret: str = "change-this-in-production"
    jwt_expire_minutes: int = 1440
    cors_origins: str = "http://localhost:5173"
    ai_base_url: str = ""
    ai_api_key: str = ""
    ai_model: str = ""
    ai_timeout: int = 30
    email_mode: str = "console"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from: str = "no-reply@example.com"
    google_sheets_webhook: str = ""
    google_drive_webhook: str = ""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

settings = Settings()
