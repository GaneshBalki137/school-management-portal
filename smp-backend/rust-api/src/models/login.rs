enum Role {
    Admin,
    Teacher,
    Student
}

struct Login {
    login_id: String,
    password: String,
    role: Role 
}

