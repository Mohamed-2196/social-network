package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path"
	"strconv"
	"time"

	"github.com/google/uuid"
	_ "github.com/mattn/go-sqlite3"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	DateOfBirth string `json:"dateOfBirth"`
	Email       string `json:"email"`
	Password    string `json:"password"`
	Nickname    string `json:"nickname"`
	AboutMe     string `json:"aboutMe"`
}

type Credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type session struct {
	id int
}

var sessions = make(map[string]session)

// CORS middleware
func enableCORS(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000") // Frontend origin
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "*")
	w.Header().Set("Access-Control-Allow-Credentials", "true")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
}

func SignUpHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r) // Enable CORS for this endpoint

	err := r.ParseMultipartForm(10 << 20) // 10 MB max
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		fmt.Println(err)
		return
	}

	user := User{
		FirstName:   r.FormValue("firstName"),
		LastName:    r.FormValue("lastName"),
		DateOfBirth: r.FormValue("dateOfBirth"),
		Email:       r.FormValue("email"),
		Password:    r.FormValue("password"),
		Nickname:    r.FormValue("nickname"),
		AboutMe:     r.FormValue("aboutMe"),
	}
	var avatarFilename string
	file, handler, err := r.FormFile("avatar")
	if err == nil {
		defer file.Close()
		avatarFilename, err = saveFile(file, handler)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		fmt.Println(err)

		return
	}

	_, err = DB.Exec("INSERT INTO users (first_name, last_name, birthday, email, password, nickname, about, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		user.FirstName, user.LastName, user.DateOfBirth, user.Email, string(hashedPassword), user.Nickname, user.AboutMe, avatarFilename)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		fmt.Println(err)

		return
	}

	userid, err := getUserIDByEmail(user.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		fmt.Println(err)

		return
	}

	sessionToken := uuid.NewString()

	sessions[sessionToken] = session{
		id: userid,
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User created successfully"})
}

func SignInHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r) // Enable CORS for this endpoint

	email := r.FormValue("email")
	password := r.FormValue("password")
	fmt.Println(email)
	fmt.Println(password)
	// Validate input
	if email == "" || password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	var storedPassword string
	// Query the database for the stored password
	err := DB.QueryRow("SELECT password FROM users WHERE email = ?", email).Scan(&storedPassword)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusUnauthorized)
			fmt.Println(err)
		} else {
			http.Error(w, "Server error", http.StatusInternalServerError)
			fmt.Println(err)
		}
		return
	}

	// Compare the provided password with the stored password
	if err = bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(password)); err != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		fmt.Println(err)
		return
	}

	// Get user ID by email
	userid, err := getUserIDByEmail(email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	// Create a new session token
	sessionToken := uuid.NewString()
	sessions[sessionToken] = session{id: userid}

	// Set the session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "session_token",
		Value:    sessionToken,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   false,
	})

	// Respond with a success message
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Signed in successfully"})
}

func SignOutHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r) // Enable CORS for this endpoint

	c, err := r.Cookie("session_token")
	if err != nil {
		if err == http.ErrNoCookie {
			http.Error(w, "No active session", http.StatusUnauthorized)
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	sessionToken := c.Value

	delete(sessions, sessionToken)

	http.SetCookie(w, &http.Cookie{
		Name:    "session_token",
		Value:   "",
		Expires: time.Now(),
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Signed out successfully"})
}

func Validcookie(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r) // Enable CORS for this endpoint

	c, err := r.Cookie("session_token")
	if err != nil {
		if err == http.ErrNoCookie {
			http.Error(w, "No active session", http.StatusUnauthorized)
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	sessionToken := c.Value
	fmt.Println("this is session of request", sessionToken)
	fmt.Println("this is sessions", sessions)

	session := sessions[sessionToken]
	fmt.Println(session)
	if session.id > 0 {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Valid session",
			"id":      strconv.Itoa(session.id),
		})
	} else {
		http.Error(w, "Invalid or expired session", http.StatusUnauthorized)
	}
}

func getUserIDByEmail(email string) (int, error) {
	var userID int
	err := DB.QueryRow("SELECT user_id FROM users WHERE email = ?", email).Scan(&userID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, fmt.Errorf("no user found with email: %s", email)
		}
		return 0, fmt.Errorf("error querying database: %v", err)
	}
	return userID, nil
}

func saveFile(file multipart.File, handler *multipart.FileHeader) (string, error) {
	// Create the uploads directory if it doesn't exist
	err := os.MkdirAll("./uploads", os.ModePerm)
	if err != nil {
		return "", err
	}

	// Get the original file extension
	ext := path.Ext(handler.Filename)

	// Generate a unique filename (UUID or timestamp)
	uniqueFilename := fmt.Sprintf("%s%s", uuid.NewString(), ext)

	// Create the destination file path
	dst, err := os.Create(fmt.Sprintf("./uploads/%s", uniqueFilename))
	if err != nil {
		return "", err
	}
	defer dst.Close()

	// Copy the file contents
	_, err = io.Copy(dst, file)
	if err != nil {
		return "", err
	}

	return uniqueFilename, nil // Return the unique filename instead of the original
}
