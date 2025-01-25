# Social Network

This project is a Facebook-like social network that includes features such as followers, profiles, posts, groups, notifications, and chats. The application is containerized using Docker, with separate containers for the backend and frontend. Below is a detailed guide on how to set up and run the project using Docker Compose.

---

## Features

### User Authentication
- **Registration**: Users can register with email, password, first name, last name, and optional fields like avatar, nickname, and "About Me."
- **Login**: Users can log in using their email and password. Sessions and cookies are used to keep users logged in.
- **Logout**: Users can log out at any time.

### Profile
- **Public/Private Profiles**: Users can toggle their profile between public and private.
- **User Information**: Displays user details, posts, followers, and following users.
- **Followers**: Users can follow/unfollow other users. Follow requests are required for private profiles.

### Posts
- **Create Posts**: Users can create posts with text and optional images/GIFs.
- **Post Privacy**: Posts can be public, visible only to followers, or visible to specific followers.
- **Comments**: Users can comment on posts.

### Groups
- **Create Groups**: Users can create groups with a title and description.
- **Group Invitations**: Group creators can invite users, and users can request to join groups.
- **Group Posts and Events**: Group members can create posts and events within the group.

### Chats
- **Private Messages**: Users can send private messages to users they follow or who follow them.
- **Group Chats**: Groups have a common chat room for members.

### Notifications
- **Real-Time Notifications**: Users receive notifications for follow requests, group invitations, and event creations.

---

## How to Run the Project with Docker Compose

### Prerequisites
- Docker and Docker Compose installed on your machine.

### Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Mohamed-2196/social-network.git
   cd social-network
   ```


2. **Build and Run the Docker Containers**:
   Run the following command to build and start the backend and frontend containers:
   ```bash
   docker-compose up --build
   ```

3. **Access the Application**:
   - Frontend: Open your browser and go to `http://localhost:3000`.
   - Backend: The backend API will be available at `http://localhost:8080`.

4. **Stop the Containers**:
   To stop the containers, use:
   ```bash
   docker-compose down
   ```
