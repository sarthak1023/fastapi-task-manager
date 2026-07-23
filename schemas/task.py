from pydantic import BaseModel, Field

class Task(BaseModel):
    title: str = Field(
        min_length =3,
        max_length =100
    )
    completed: bool

class TaskResponse(BaseModel):     # task1 day 4
    id: int
    title: str
    completed: bool 