from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://affinities:affinities@localhost:5432/affinities"

    class Config:
        env_file = ".env"


settings = Settings()
