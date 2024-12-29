package handlers

import (
	"github.com/gorilla/mux"
)

func AddHandlers(r *mux.Router) {
	//Sign Up Stuff
	r.HandleFunc("/signup", SignUpHandler).Methods("POST")
	r.HandleFunc("/signin", SignInHandler).Methods("POST")
	r.HandleFunc("/logout", SignOutHandler).Methods("POST")

	//Cookie
	r.HandleFunc("/cook", Validcookie).Methods("POST")

	//Profile Stuff
	r.HandleFunc("/profile", UserDataHandler).Methods("POST")
	r.HandleFunc("/profile/edit", EditProfileHandler).Methods("POST")
	r.HandleFunc("/likepost", LikePostHandler).Methods("POST")
	r.HandleFunc("/user/profile", GetUserProfileHandler).Methods("GET")
	r.HandleFunc("/follow", SendFollowRequestHandler).Methods("POST")
	r.HandleFunc("/unfollow", SendUnfollowRequestHandler).Methods("POST")

	//Group Stuff
	r.HandleFunc("/group", HandleGroup).Methods("POST")
	r.HandleFunc("/publicGroup", HandlePublicGroup).Methods("POST")
	r.HandleFunc("/myGroups", HandleMyGroups).Methods("POST")
	r.HandleFunc("/groupchat/{groupid}", HandleGroupChat).Methods("POST")
	r.HandleFunc("/addMembers", HandleGroupMembers).Methods("POST")
	r.HandleFunc("/sendGroupMessage/{groupid}", HandleGroupMessage).Methods("POST")
	r.HandleFunc("/getGroupMessage/{groupid}", HandleGetGroupMessage).Methods("POST")

	r.HandleFunc("/mutuals", HandleMutuals).Methods("POST")

	//Sockets And Notifications
	r.HandleFunc("/ws", Ws).Methods("GET")
	r.HandleFunc("/notificationnum", notificationnumber).Methods("GET")
	r.HandleFunc("/notifications", getNotifications).Methods("POST")
	r.HandleFunc("/managenotifications", manageNotification).Methods("POST")

	//Post Stuff
	r.HandleFunc("/createpost", CreatePostHandler).Methods("POST")
	r.HandleFunc("/createdposts", CreatedPostsHandler).Methods("POST")
	// r.HandleFunc("/createcomment" , CreateCommentHandler).Methods("POST")

	//Temporary Stuff for Testing purposes.
	r.HandleFunc("/test", TestHandler).Methods("POST")
	// r.HandleFunc("/getpost", HandlePosts).Methods("POST")
	r.HandleFunc("/followers", GetFollowersHandler).Methods("GET")
	r.HandleFunc("/followings", GetFollowingHandler).Methods("GET")
	r.HandleFunc("/home", HomeHandler).Methods("GET")
	r.HandleFunc("/post", GetPostAndCommentsHandler).Methods("GET")
	r.HandleFunc("/comments", CreateCommentHandler).Methods("POST")

	//chat stuff 
	r.HandleFunc("/chat/info" , GetChatInfo).Methods("GET")
	r.HandleFunc("/chatusers" , GetChatUsers).Methods("GET")
	r.HandleFunc("/messages" , GetMessages).Methods("POST")
	r.HandleFunc("/mnchat" , manageNotificationinchat).Methods("POST")
}
