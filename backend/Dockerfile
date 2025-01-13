# Use the official Golang image
FROM golang:1.23

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy the Go Modules files
COPY go.mod .

# Download dependencies as separate layers to improve caching
RUN go mod download

# Copy the source code from the current directory to the Working Directory inside the container
COPY . .

# Build the Go app
RUN go build -o bin/server .

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
CMD ["/app/bin/server"]
