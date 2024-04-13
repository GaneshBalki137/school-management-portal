enum Role {
    Admin,
    Teacher,
    Student
}

pub struct Login {
    login_id: String,
    password: String,
    role: Role 
}

