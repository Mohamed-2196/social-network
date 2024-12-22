package handlers

import (
	"github.com/gorilla/mux"
)

func AddHandlers(r *mux.Router) {
	r.HandleFunc("/signup", SignUpHandler).Methods("POST")  // Specify POST method
	r.HandleFunc("/signin", SignInHandler).Methods("POST")  // Specify POST method
	r.HandleFunc("/logout", SignOutHandler).Methods("POST") // Specify POST method
	r.HandleFunc("/cook", Validcookie).Methods("POST")       // Specify GET method
	r.HandleFunc("/profile", UserDataHandler).Methods("POST")       // Specify GET method
	r.HandleFunc("/profile/edit", EditProfileHandler).Methods("POST")       // Specify GET method
	r.HandleFunc("/", CreatePostHandler).Methods("POST")
	r.HandleFunc("/ws", Ws).Methods("GET")

}
