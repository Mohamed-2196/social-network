package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
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

func SignUpHandler(w http.ResponseWriter, r *http.Request) {
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
		SameSite: http.SameSiteStrictMode,
	})
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User created successfully"})
}

func SignInHandler(w http.ResponseWriter, r *http.Request) {
	var creds Credentials
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var storedPassword string
	err = DB.QueryRow("SELECT password FROM users WHERE email = ?", creds.Email).Scan(&storedPassword)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusUnauthorized)
		} else {
			http.Error(w, "Server error", http.StatusInternalServerError)
		}
		return
	}

	if err = bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(creds.Password)); err != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}
	userid, err := getUserIDByEmail(creds.Email)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
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
		SameSite: http.SameSiteStrictMode,
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Signed in successfully"})
}

func SignOutHandler(w http.ResponseWriter, r *http.Request) {
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

	session, exists := sessions[sessionToken]
	if exists {
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
	err := os.MkdirAll("./uploads", os.ModePerm)
	if err != nil {
		return "", err
	}

	dst, err := os.Create(fmt.Sprintf("./uploads/%s", handler.Filename))
	if err != nil {
		return "", err
	}
	defer dst.Close()

	_, err = io.Copy(dst, file)
	if err != nil {
		return "", err
	}

	return handler.Filename, nil
}
