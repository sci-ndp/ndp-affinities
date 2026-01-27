from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://affinities:affinities@localhost:5432/affinities"
    cors_origins: str = "*"

    class Config:
        env_file = ".env"

    def get_cors_origins(self) -> list[str]:
        if self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
