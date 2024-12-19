package main

import (
	"database/sql"
	"fmt"
	"net/http" // Import migration package with alias db

	_ "github.com/mattn/go-sqlite3"
	migration "github.com/yourusername/social-network/backend/db"
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

	// Set up HTTP routing and handlers, passing db to handlers
	mux := http.NewServeMux()
	//handlers.AddHandlers(mux, db)

	// Start the HTTP server
	err = http.ListenAndServe(":8080", mux)
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}
