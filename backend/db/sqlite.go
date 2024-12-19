package migration

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

var DB *sql.DB

// Database initializes the database connection and runs migrations.
func Database() {
	DB = OpenDB()
	if err := Migrations(DB); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	fmt.Println("Connection to database established and migrations applied.")
}

// Migrations runs the migration files on the given database connection.
func Migrations(db *sql.DB) error {
	m, err := migrate.New("file://db/migration", "sqlite3://database.db")
	if err != nil {
		log.Printf("Error creating migration: %v", err)
		return err
	}

	if err := m.Force(0); err != nil {
		log.Printf("Failed to reset migrations: %v", err)
		return err
	}
	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Printf("Migration error: %v", err)
		return err
	}
	return nil
}

func OpenDB() *sql.DB {
	db, err := sql.Open("sqlite3", "../database/database.db")
	if err != nil {
		fmt.Println("(db.go) Unable to open db due to:")
		log.Fatal(err)
	}

	// Using PING to establish a new connection to the database
	err = db.Ping()
	if err != nil {
		fmt.Println("(db.go) Unable to ping due to:")
		log.Fatal(err)
	}

	// Returns DB connection pool
	return db
}
