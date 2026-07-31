from typing import Optional # day 8 for  description field

from pydantic import BaseModel, Field

class Task(BaseModel):
    title: str = Field(
        min_length =3,
        max_length =100
    )
    description: Optional[str] = None                           # day 8 added description field
    completed: bool

class TaskResponse(BaseModel):     # task1 day 4
    id: int
    title: str
    completed: bool 

class CreateTaskresponse(BaseModel):               #entered because of 500 error in post end point
    message: str
    task: TaskResponse