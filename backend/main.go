package main

import (
	"database/sql"
	"fmt"
	"net/http" // Import migration package with alias db

	migration "social/db"
	handlers "social/handlers"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	dbb, err := sql.Open("sqlite3", "./database.db")
	if err != nil {
		fmt.Println("Error opening database:", err)
		return
	}
	defer dbb.Close()
	// Run migrations to set up the database
	if err := migration.Migrations(dbb); err != nil { // Use db alias here
		fmt.Println("Migration error:", err)
		return
	}
	handlers.Migrations()
	// Set up HTTP routing and handlers, passing db to handlers
	r := mux.NewRouter()
	handlers.AddHandlers(r)
	//handlers.AddHandlers(mux, db)

	// Start the HTTP server
	err = http.ListenAndServe(":8080", r)
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}
