const database = include('databaseConnection');
async function createUser(postData) {
    let createUserSQL = `
        INSERT INTO user
        (username, email, password_hash)
        VALUES
        (?, ?, ?);
    `;

    let params = [
        postData.username,
        postData.email,
        postData.hashedPassword
    ];

    try {
        const results = await database.query(createUserSQL, params);

        console.log("Successfully created user");
        console.log(results[0]);
        return true;
    } catch (err) {
        console.log("Error inserting user");
        console.log(err);
        return false;
    }
}

async function getUserByEmail(email) {
    let getUserByEmailSQL = `
        SELECT * FROM user WHERE email = ?;
    `;
    try {
        const [rows, fields] = await database.query(getUserByEmailSQL, [email]);
        if (rows.length > 0) {
            return rows[0]; // Assuming email is unique, return the first user found
        } else {
            return null; // No user found with the provided email
        }
    } catch (err) {
        console.error("Error retrieving user by email:", err);
        throw err;
    }
}

async function getUser(postData) {
    let getUserSQL = `
    SELECT user_id, username, password_hash
    FROM user
    WHERE username = :username AND password_hash = :hashPassword;
`;

    let params = {
        username: postData.user,
        hashPassword: postData.hashedPassword
    };

    try {
        const results = await database.query(getUserSQL, params);
        console.log("Successfully found user");
        console.log(results[0]);
        return results[0];
    } catch (err) {
        console.log("Error trying to find user");
        console.log(err);
        return false;
    }
}

async function getAllUsers() {
    try {
        const query = `
            SELECT user_id, username
            FROM user;
        `;
        const [rows, fields] = await database.query(query);
        return rows;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

async function getRoomUserId(room_id, user_id) {
    const query = `SELECT room_user_id FROM room_user WHERE room_id = ? AND user_id = ?;`;
    try {
        const results = await database.query(query, [room_id, user_id]);
        return results[0][0].room_user_id;
    } catch (e) {
        console.error('Error fetching room_user_id:', e);
        throw e;
    }
}

async function getGroupsData(user_id) {
    try {
        const query = `
        SELECT ru.room_id, r.name AS group_name,
        (SELECT MAX(m.sent_datetime) 
        FROM message m 
        JOIN room_user ru2 ON m.room_user_id = ru2.room_user_id
        WHERE ru2.room_id = ru.room_id) AS mostRecentMessageDate
    FROM room_user ru
    JOIN room r ON ru.room_id = r.room_id
    WHERE ru.user_id = ?;
        `;
        const [rows, fields] = await database.query(query, [user_id]);

        const groups = rows.map(row => ({
            room_id: row.room_id,
            name: row.group_name,
            mostRecentMessageDate: row.mostRecentMessageDate,
            // You can add other properties if needed
        }));

        return groups;
    } catch (error) {
        console.error('Error fetching groups data:', error);
        throw error;
    }
}




async function findUsers(email, username) {
    let query = `SELECT * FROM user WHERE username = ? OR username = ?;`;
    try {
        const results = await database.query(query, [email, username]);
        return results[0];
    } catch (e) {
        console.error(e);
        console.log("Error finding user");
        return false;
    }
}

async function getGroupData(room_id) {
    try {
        const query = `
            SELECT room_id, name
            FROM room
            WHERE room_id = ?;
        `;
        const [rows, fields] = await database.query(query, [room_id]);
        return rows[0];
    } catch (error) {
        console.error('Error fetching group data:', error);
        throw error;
    }
}

async function createGroup(groupName) {
    const createGroupSQL = `
		INSERT INTO room
		(name)
		VALUES
		(?);
	`;

    try {
        const results = await database.query(createGroupSQL, [groupName]);
        console.log("Successfully created group");
        console.log(results[0]);
        return results[0].insertId;
    } catch (err) {
        console.log("Error inserting group");
        console.log(err);
        return false;
    }
}

// Function to retrieve the ID of the most recent read message for a group
async function getMostRecentReadMessageId(groupId) {
    try {
        const query = `
            SELECT last_read_message
            FROM room_user
            WHERE room_id = ?
        `;
        const [rows, fields] = await database.query(query, [groupId]);
        if (rows.length > 0) {
            return rows[0].last_read_message;
        } else {
            return null; // Return null if no most recent read message found
        }
    } catch (error) {
        console.error('Error getting most recent read message ID:', error);
        throw error;
    }
}

// Function to count the number of unread messages for a group
async function countUnreadMessages(room_user_id, mostRecentReadMessageId) {
    try {
        const query = `
            SELECT COUNT(*) AS unreadMessagesCount
            FROM message
            WHERE room_user_id = ? AND message_id > ?
        `;
        const [rows, fields] = await database.query(query, [room_user_id, mostRecentReadMessageId]);
        return rows[0].unreadMessagesCount;
    } catch (error) {
        console.error('Error counting unread messages:', error);
        throw error;
    }
}

async function addUserToGroup(groupId, selectedUsers) {
    try {
        // Filter out any NULL or invalid user_id values
        const validUsers = selectedUsers.filter(userId => userId !== null && userId !== undefined);

        // Remove duplicate user IDs
        const uniqueUsers = [...new Set(validUsers)];

        if (uniqueUsers.length === 0) {
            console.error('No valid user IDs provided.');
            return;
        }

        const values = uniqueUsers.map(userId => [groupId, userId]);
        const query = `
            INSERT INTO room_user (room_id, user_id)
            VALUES ${values.map(() => '(?, ?)').join(', ')}
        `;
        await database.query(query, values.flat());
        console.log(`Users added to group ${groupId}`);
    } catch (error) {
        console.error('Error adding users to group:', error);
        throw error;
    }
}



async function sendMessage(room_user_id, text) {
    const sendMessageSQL = `
        INSERT INTO message
        (room_user_id, text)
        VALUES
        (?, ?);
    `;

    try {
        const results = await database.query(sendMessageSQL, [room_user_id, text]);
        console.log("Successfully sent message");
        console.log(results[0]);
        return true;
    } catch (err) {
        console.log("Error sending message");
        console.log(err);
        return false;
    }
}

async function addReaction(message_id, user_id, emoji) {
    try {
        const query = `
            INSERT INTO message_reaction (message_id, user_id, emoji)
            VALUES (?, ?, ?);
        `;
        const [result] = await database.query(query, [message_id, user_id, emoji]);
        return result.insertId; // Return the ID of the inserted reaction
    } catch (error) {
        console.error('Error adding reaction:', error);
        throw error;
    }
}

// Assuming you have access to your database connection object, `database`

// Assuming you have access to your database connection object, `database`

async function getMessagesWithReactionsByRoomId(room_id, user_id) {
    try {
        // Fetch messages for the specified room_id, including reactions
        const query = `
            SELECT message.*, user.username, GROUP_CONCAT(emoji) AS reactions
            FROM message
            LEFT JOIN message_reaction ON message.message_id = message_reaction.message_id
            JOIN room_user ON message.room_user_id = room_user.room_user_id
            JOIN user ON room_user.user_id = user.user_id
            WHERE room_user.room_id = ?
            GROUP BY message.message_id
            ORDER BY message.sent_datetime;`;

        const [rows, fields] = await database.query(query, [room_id, user_id]);
        return rows;
    } catch (error) {
        console.error('Error fetching messages with reactions:', error);
        throw error;
    }
}






module.exports = {
    createUser,
    getMessagesWithReactionsByRoomId,
    getUser,
    addReaction,
    getUserByEmail,
    getGroupsData,
    findUsers,
    getRoomUserId,
    createGroup, 
    getGroupData, 
    countUnreadMessages, 
    getMostRecentReadMessageId, 
    sendMessage,  
    getAllUsers, 
    addUserToGroup,

};

// Str0ngP@ssw0rd!
//change the query getGroupsData to set the user_id to the user_id from the session, right now its hard coded to be 4
//change the query getMessagesByRoomId to set the user_id to the user_id from the session, right now its 1 and 1 because the daytabase idsnt populted accordinly 


// <% message.reactions.forEach(reaction => { %>
//     <li><%= reaction.emoji %></li>
// <% }); %>