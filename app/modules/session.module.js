const { signIn } = require('./aiease.module.js')

class SessionAiease {
    constructor() {
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
        this.sessions = new Map();
    }
    saveSession(sessionId, sessionData) {
        if (!sessionId) {
            throw new Error('Session ID is required');
        }
        // Nếu session đã tồn tại, merge dữ liệu mới với dữ liệu cũ
        if (this.sessions.has(sessionId)) {
            const existingData = this.sessions.get(sessionId);
            this.sessions.set(sessionId, {
                ...existingData,
                ...sessionData,
                lastUpdated: new Date().toISOString()
            });
        } else {
            // Nếu session chưa tồn tại, tạo mới với timestamp
            this.sessions.set(sessionId, {
                ...sessionData,
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                requests: sessionData.requests || []
            });
        }
        return true;
    }
    getSession(sessionId) {
        if (!sessionId) {
            return null;
        }
        return this.sessions.get(sessionId) || null;
    }
    getAllSessions() {
        return Array.from(this.sessions.entries()).map(([sessionId, data]) => ({
            sessionId,
            ...data
        }));
    }
    deleteSession(sessionId) {
        if (!sessionId) {
            return false;
        }
        return this.sessions.delete(sessionId);
    }
    async initSession(sessionId = null) {
        try {
            // Nếu đã có sessionId và đã lưu trong bộ nhớ, sử dụng lại token
            if (sessionId && this.sessions.has(sessionId)) {
                const sessionData = this.sessions.get(sessionId);
                return {
                    sessionId,
                    ...sessionData,
                    fromCache: true
                };
            }
            const data = await signIn();
            // console.log(data)
            if (data.code == 200) {
                const assignedSessionId = this._generateUUID();
                // Lưu thông tin phiên
                this.saveSession(assignedSessionId, data.result.user);
                return {
                    sessionId: assignedSessionId,
                    ...this.getSession(assignedSessionId),
                    fromCache: false
                };
            }
            else {
                return false
            }
        } catch (error) {
            return false
        }
    }
    _generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

// ------------------------------------
const instance = new SessionAiease();

// Export instance ------------------------------------
module.exports = instance;