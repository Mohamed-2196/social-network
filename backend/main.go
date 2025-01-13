package main

import (
	"database/sql"
	"fmt"
	"net/http" // Import migration package with alias db
	migration "social/db"
	handlers "social/handlers"

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
	mux := http.NewServeMux()
	handlers.AddHandlers(mux)

	// Serve static files
	fs := http.FileServer(http.Dir("./uploads"))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", fs))

	// Start the HTTP server
	fmt.Println("Server started at :8080")
	err = http.ListenAndServe(":8080", mux)
	if err != nil {
		fmt.Println("Error starting server:", err)
	}
}
