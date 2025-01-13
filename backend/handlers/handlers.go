package handlers

import (
	"net/http"
)

func AddHandlers(mux *http.ServeMux) {
	// Sign Up Stuff
	mux.HandleFunc("POST /signup", SignUpHandler)
	mux.HandleFunc("POST /signin", SignInHandler)
	mux.HandleFunc("POST /logout", SignOutHandler)

	// Cookie
	mux.HandleFunc("POST /cook", Validcookie)

	// Profile Stuff
	mux.HandleFunc("POST /profile", UserDataHandler)
	mux.HandleFunc("POST /profile/edit", EditProfileHandler)
	mux.HandleFunc("POST /likepost", LikePostHandler)
	mux.HandleFunc("GET /user/profile", GetUserProfileHandler)
	mux.HandleFunc("POST /follow", SendFollowRequestHandler)
	mux.HandleFunc("POST /unfollow", SendUnfollowRequestHandler)

	// Group Stuff
	mux.HandleFunc("POST /group/post/{postid}/comments", HandleAddGroupComment)
	mux.HandleFunc("GET /group/post/{postid}", HandleGetPostDetails)
	mux.HandleFunc("POST /group", HandleGroup)
	mux.HandleFunc("POST /publicGroup", HandlePublicGroup)
	mux.HandleFunc("POST /myGroups", HandleMyGroups)
	mux.HandleFunc("POST /groupchat/{groupid}", HandleGroupChat)
	mux.HandleFunc("POST /sendGroupMessage/{groupid}", HandleGroupMessage)
	mux.HandleFunc("POST /getGroupMessage/{groupid}", HandleGetGroupMessage)
	mux.HandleFunc("POST /createGroupPost/{groupid}", HanldeGroupPost)
	mux.HandleFunc("POST /getGroupPosts/{groupid}", HandleGetGroupPosts)
	mux.HandleFunc("GET /inviteableusers/{groupid}", Invitableusers)
	mux.HandleFunc("POST /invite/{groupid}", Inviteothers)
	mux.HandleFunc("POST /request/{groupid}", Request)
	mux.HandleFunc("POST /sendGroupPoll/{groupid}", HandleGroupPoll)
	mux.HandleFunc("POST /sendPollVote/{pollID}", HandlePolVotes)

	// Mutuals
	mux.HandleFunc("POST /mutuals", HandleMutuals)

	// Sockets And Notifications
	mux.HandleFunc("GET /ws", Ws)
	mux.HandleFunc("GET /notificationnum", notificationnumber)
	mux.HandleFunc("POST /notifications", getNotifications)
	mux.HandleFunc("POST /managenotifications", manageNotification)

	// Post Stuff
	mux.HandleFunc("POST /createpost", CreatePostHandler)
	mux.HandleFunc("POST /createdposts", CreatedPostsHandler)

	// Temporary Stuff for Testing purposes
	mux.HandleFunc("POST /test", TestHandler)
	mux.HandleFunc("GET /followers", GetFollowersHandler)
	mux.HandleFunc("GET /followings", GetFollowingHandler)
	mux.HandleFunc("GET /home", HomeHandler)
	mux.HandleFunc("GET /post", GetPostAndCommentsHandler)
	mux.HandleFunc("POST /comments", CreateCommentHandler)

	// Chat Stuff
	mux.HandleFunc("GET /chat/info", GetChatInfo)
	mux.HandleFunc("GET /chatusers", GetChatUsers)
	mux.HandleFunc("POST /messages", GetMessages)
	mux.HandleFunc("POST /mnchat", manageNotificationinchat)
}