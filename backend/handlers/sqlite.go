package handlers

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/mattn/go-sqlite3"
)

// DB holds the database connection
var DB *sql.DB

func Migrations() error {
	var err error
	DB, err = sql.Open("sqlite3", "./database.db")
	if err != nil {
		log.Printf("Error opening database: %v", err)
		return err
	}

	if err = DB.Ping(); err != nil {
		log.Printf("Error connecting to database: %v", err)
		return err
	}

	m, err := migrate.New("file://db/migration", "sqlite3:database.db")
	if err != nil {
		log.Printf("Error creating migration: %v", err)
		return err
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Printf("Error running migrations: %v", err)
		return err
	}

	fmt.Println("Database migrations completed successfully")
	return nil
}
