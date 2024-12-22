package handlers

import (
	"github.com/gorilla/mux"
)

func AddHandlers(r *mux.Router) {
	r.HandleFunc("/group", HandleGroupChat).Methods("POST") // Specify POST method
	r.HandleFunc("/signup", SignUpHandler).Methods("POST")  // Specify POST method
	r.HandleFunc("/signin", SignInHandler).Methods("POST")  // Specify POST method
	r.HandleFunc("/logout", SignOutHandler).Methods("POST") // Specify POST method
	r.HandleFunc("/cook", Validcookie).Methods("POST")       
	r.HandleFunc("/profile", UserDataHandler).Methods("POST")       
	r.HandleFunc("/profile/edit", EditProfileHandler).Methods("POST")       // Specify GET method

}
