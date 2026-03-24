# Project Documentation: Database Schema & Architecture

This document provides a detailed overview of the database tables (collections), the Entity-Relationship (ER) diagram, and the Data Flow Diagram (DFD) for the **TalkBridge-Secure-Video-Conferencing** project.

## 1. Database Tables (MongoDB Collections)

The project uses MongoDB for data storage. Below are the details of each collection:

### A. Users Collection (`User.js`)
Stores information about registered users and administrators.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Full name of the user. |
| `email` | String | Unique email address (used for login). |
| `mobileNo` | String | User's mobile number (10 digits). |
| `password` | String | Hashed password for security. |
| `role` | String | User role: `user` or `admin`. |
| `createdAt`| Date | Timestamp when the user registered. |

**Used in:** `authController.js` (Register, Login), `adminController.js` (User management).

---

### B. Meetings Collection (`Meeting.js`)
Stores details about video conferences created on the platform.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `meetingId`| String | Unique ID for the meeting (used for joining). |
| `title` | String | Title or topic of the meeting. |
| `createdBy`| ObjectId| Reference to the `User` who hosted the meeting. |
| `participants`| Array | List of `User` IDs currently in the meeting. |
| `startTime`| Date | Scheduled/Actual start time. |
| `endTime` | Date | Time when the meeting concluded. |
| `duration` | Number | Planned duration in minutes. |
| `status` | String | Status: `active` or `ended`. |

**Used in:** `meetingController.js` (Create, Start, End, Join), `adminController.js` (Meeting logs).

---

### C. Invitations Collection (`Invitation.js`)
Tracks meeting invites sent to users.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `meetingId`| String | ID of the meeting the user is invited to. |
| `sender` | ObjectId| Reference to the `User` who sent the invite. |
| `receiver` | ObjectId| Reference to the registered `User` receiver (Optional).|
| `receiverEmail`| String | Email of the person invited. |
| `status` | String | `pending`, `accepted`, or `rejected`. |
| `createdAt`| Date | When the invitation was sent. |

**Used in:** `invitationController.js` (Send invite, Accept/Reject invite).

---

### D. Messages Collection (`Message.js`)
Stores real-time group chat messages within a meeting.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `meetingId`| String | The meeting where the message was sent. |
| `sender` | ObjectId| Reference to the `User` who sent the message. |
| `message` | String | Text content of the message. |
| `timestamp`| Date | Time of sending. |

**Used in:** `chatController.js` (Group chat history).

---

### E. PrivateMessages Collection (`PrivateMessage.js`)
Stores direct one-to-one messages between users.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `sender` | ObjectId| Reference to the sending `User`. |
| `receiver` | ObjectId| Reference to the receiving `User`. |
| `message` | String | Text content of the message. |
| `status` | String | `sent`, `delivered`, or `seen`. |
| `timestamp`| Date | Time of sending. |

**Used in:** `chatController.js` (One-to-one chat).

---

### F. Notifications Collection (`Notification.js`)
Stores alerts for users (e.g., new invites, meeting alerts).

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `user` | ObjectId| Reference to the `User` receiving the alert. |
| `title` | String | Alert title. |
| `message` | String | Detailed notification message. |
| `type` | String | Type: `invitation`, `accepted`, `meeting_ended`, etc.|
| `link` | String | URL to redirect the user (e.g., to join meeting). |
| `isRead` | Boolean | Whether the notification has been seen. |

**Used in:** `notificationController.js` (Fetch notifications, Mark as read).

---

## 2. ER-Diagram (Entity-Relationship)

```mermaid
erDiagram
    USER ||--o{ MEETING : "hosts"
    USER ||--o{ INVITATION : "sends/receives"
    USER ||--o{ MESSAGE : "sends"
    USER ||--o{ PRIVATE_MESSAGE : "sends/receives"
    USER ||--o{ NOTIFICATION : "receives"
    MEETING ||--o{ MESSAGE : "contains"
    MEETING ||--o{ INVITATION : "linked to"
    
    USER {
        ObjectId _id
        string name
        string email
        string mobileNo
        string password
        string role
    }
    
    MEETING {
        string meetingId
        string title
        ObjectId createdBy
        Array participants
        Date startTime
        string status
    }
    
    INVITATION {
        string meetingId
        ObjectId sender
        ObjectId receiver
        string receiverEmail
        string status
    }
    
    MESSAGE {
        string meetingId
        ObjectId sender
        string message
        Date timestamp
    }
    
    PRIVATE_MESSAGE {
        ObjectId sender
        ObjectId receiver
        string message
        string status
    }

    NOTIFICATION {
        ObjectId user
        string title
        string type
        boolean isRead
    }
```

---

## 3. Data Flow Diagram (DFD) - Level 1

```mermaid
graph TD
    User((User/Admin)) -->|Registration/Login| Auth[Process 1.0: Authentication]
    Auth -->|Store/Verify| DB[(Database: Users)]
    
    User -->|Create Meeting| MeetingMgmt[Process 2.0: Meeting Management]
    MeetingMgmt -->|Save Meeting| DB_M[(Database: Meetings)]
    
    User -->|Send Invite| InviteMgmt[Process 3.0: Invitation Management]
    InviteMgmt -->|Save Invite| DB_I[(Database: Invitations)]
    InviteMgmt -->|Trigger| Notify[Process 4.0: Notification Service]
    Notify -->|Save Alert| DB_N[(Database: Notifications)]
    
    User -->|Send Message| ChatMgmt[Process 5.0: Chat Service]
    ChatMgmt -->|Save Msg| DB_C[(Database: Messages/PrivateMessages)]
    
    Admin((Administrator)) -->|View Reports| AdminPanel[Process 6.0: Admin Dashboard]
    AdminPanel -->|Read All Data| DB
```

---

## 4. Summary of Data Flow
1.  **User Authentication:** User submits credentials via the Frontend. The Backend (`authController`) verifies against the `Users` collection.
2.  **Meeting Lifecycle:** A host creates a meeting (`Meeting` collection). Participants join via `meetingId`. Real-time data flows through Socket.io (if implemented) and stores in `Messages`.
3.  **Communication:** Invitations create records in the `Invitations` collection and trigger an entry in the `Notifications` collection for the recipient.
4.  **Administration:** The Admin role accesses aggregated data from all collections to monitor platform activity.
