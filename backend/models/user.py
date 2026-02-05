from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from . import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    login = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    email = Column(String, unique=True)
    role = Column(String, default='user')  # 'admin', 'manager', 'user'
    full_name = Column(String)  # ФИО пользователя для связи с авторами статей

    # Обратная связь для подразделения, которым управляет пользователь (если он менеджер)
    managed_department = relationship("Department", back_populates="manager")