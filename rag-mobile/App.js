import 'react-native-gesture-handler';
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Modal,
  ScrollView
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { chatService, setAuthToken } from './src/api/api';

const STORAGE_KEY = '@rag_chat_history';
const DEFAULT_MESSAGE = { 
  id: '1', 
  text: 'Hello! I am your RAG AI Assistant. How can I help you today?', 
  isUser: false, 
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('verifier@test.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  
  // Chat States
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([DEFAULT_MESSAGE]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const flatListRef = useRef();

  // Load history from local storage on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (e) {
      console.error('Failed to load history');
    }
  };

  const saveToHistory = async (newMessages) => {
    try {
      const updatedHistory = [
        { id: Date.now().toString(), date: new Date().toLocaleString(), messages: newMessages },
        ...history
      ].slice(0, 10); // Keep last 10 chats
      setHistory(updatedHistory);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (e) {
      console.error('Failed to save history');
    }
  };

  // 1. New Chat Button Logic
  const handleNewChat = () => {
    if (messages.length > 1) {
      saveToHistory(messages); // Auto-save current chat to history before clearing
    }
    setMessages([DEFAULT_MESSAGE]);
    setQuery('');
  };

  // 2. Chat History Reopening
  const openHistoryItem = (item) => {
    setMessages(item.messages);
    setShowHistory(false);
  };

  // 3. Document Upload Logic
  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/pdf'],
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setLoading(true);
        
        const uploadResult = await chatService.uploadDocument(file.uri, file.name, file.mimeType);
        
        if (uploadResult.success) {
          Alert.alert('Success', `File "${file.name}" uploaded and indexed successfully.`);
          // Add a system message to chat
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            text: `📁 System: Document "${file.name}" has been added to the knowledge base.`,
            isUser: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }
      }
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Error uploading document.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Logout Logic
  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: async () => {
        setAuthToken(null);
        setIsLoggedIn(false);
        setMessages([DEFAULT_MESSAGE]);
      }}
    ]);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please enter your credentials to continue.');
      return;
    }

    setLoading(true);
    try {
      const result = await chatService.login(email, password);
      if (result.success) {
        setAuthToken(result.token);
        setIsLoggedIn(true);
      } else {
        Alert.alert('Access Denied', result.message || 'Invalid email or password.');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Backend server unreachable. Please check your network and IP address.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage = { 
      id: Date.now().toString(), 
      text: query, 
      isUser: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await chatService.sendMessage(userMessage.text);
      const botMessage = { 
        id: (Date.now() + 1).toString(), 
        text: response.answer || 'I encountered an issue processing your request.', 
        isUser: false,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = { 
        id: (Date.now() + 1).toString(), 
        text: '⚠️ Network error. Please check your backend connection.', 
        isUser: false,
        isError: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageWrapper, 
      item.isUser ? styles.userWrapper : styles.botWrapper
    ]}>
      {!item.isUser && (
        <View style={styles.botIconCircle}>
          <Ionicons name="hardware-chip-outline" size={16} color="#fff" />
        </View>
      )}
      <View style={[
        styles.messageBubble, 
        item.isUser ? styles.userBubble : styles.botBubble,
        item.isError && styles.errorBubble
      ]}>
        <Text style={item.isUser ? styles.userText : styles.botText}>{item.text}</Text>
        <Text style={[styles.timeText, item.isUser ? styles.userTime : styles.botTime]}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      <SafeAreaView style={styles.container}>
        {!isLoggedIn ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authContainer}>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}><Ionicons name="chatbubbles" size={50} color="#1A73E8" /></View>
              <Text style={styles.mainTitle}>RAG Chatbot</Text>
              <Text style={styles.tagline}>Intelligent Document Assistant</Text>
            </View>
            <View style={styles.formContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
              </View>
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <View style={styles.buttonContent}><Text style={styles.loginButtonText}>Sign In</Text><Ionicons name="arrow-forward" size={20} color="#fff" /></View>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatScreen} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
            {/* --- HEADER WITH NEW FEATURES --- */}
            <View style={styles.chatHeader}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={handleLogout} style={styles.backBtn}>
                  <Ionicons name="log-out-outline" size={24} color="#D93025" />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                  <Text style={styles.headerTitle}>RAG Assistant</Text>
                  <View style={styles.onlineContainer}><View style={styles.onlineDot} /><Text style={styles.onlineText}>Connected</Text></View>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={handleNewChat} style={styles.headerIconBtn}>
                  <Ionicons name="add-circle" size={26} color="#1A73E8" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowHistory(true)} style={styles.headerIconBtn}>
                  <Ionicons name="time-outline" size={26} color="#333" />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.chatListContent}
              showsVerticalScrollIndicator={false}
            />

            {loading && <View style={styles.typingContainer}><ActivityIndicator size="small" color="#1A73E8" /><Text style={styles.typingText}>Processing...</Text></View>}

            <View style={styles.chatInputWrapper}>
              <TouchableOpacity style={styles.attachBtn} onPress={handleDocumentUpload}>
                <Ionicons name="document-attach-outline" size={28} color="#1A73E8" />
              </TouchableOpacity>
              <View style={styles.chatInputInner}>
                <TextInput style={styles.professionalInput} placeholder="Ask a question..." value={query} onChangeText={setQuery} multiline placeholderTextColor="#999" />
                <TouchableOpacity style={[styles.sendCircle, !query.trim() && styles.sendDisabled]} onPress={handleSend} disabled={loading || !query.trim()}>
                  <Ionicons name="send" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* --- HISTORY MODAL --- */}
            <Modal visible={showHistory} animationType="slide" transparent={true}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Chat History</Text>
                    <TouchableOpacity onPress={() => setShowHistory(false)}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
                  </View>
                  <ScrollView style={styles.historyList}>
                    {history.length === 0 ? (
                      <Text style={styles.emptyHistory}>No previous chats found.</Text>
                    ) : (
                      history.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.historyItem} onPress={() => openHistoryItem(item)}>
                          <Ionicons name="chatbox-outline" size={20} color="#1A73E8" />
                          <View style={{marginLeft: 12}}>
                            <Text style={styles.historyDate}>{item.date}</Text>
                            <Text style={styles.historyPreview} numberOfLines={1}>
                              {item.messages[1]?.text || "New conversation"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  // Auth Styles
  authContainer: { flex: 1, padding: 25, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E8F0FE', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: '#202124' },
  tagline: { fontSize: 16, color: '#5F6368', marginTop: 5 },
  formContainer: { width: '100%' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, height: 55, elevation: 2 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  loginButton: { height: 55, backgroundColor: '#1A73E8', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  buttonContent: { flexDirection: 'row', alignItems: 'center' },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 8 },
  // Chat Styles
  chatScreen: { flex: 1, backgroundColor: '#fff' },
  chatHeader: { height: 65, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#F1F3F4' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row' },
  headerIconBtn: { marginLeft: 15 },
  backBtn: { padding: 5, marginRight: 5 },
  headerInfo: { justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#202124' },
  onlineContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34A853', marginRight: 5 },
  onlineText: { fontSize: 12, color: '#5F6368' },
  chatListContent: { padding: 15, paddingBottom: 20 },
  messageWrapper: { marginBottom: 15, flexDirection: 'row', alignItems: 'flex-end' },
  userWrapper: { justifyContent: 'flex-end' },
  botWrapper: { justifyContent: 'flex-start' },
  botIconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1A73E8', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  messageBubble: { maxWidth: '75%', padding: 14, borderRadius: 20 },
  userBubble: { backgroundColor: '#1A73E8', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#F1F3F4', borderBottomLeftRadius: 4 },
  errorBubble: { backgroundColor: '#FEE8E1', borderWidth: 1, borderColor: '#F28B82' },
  userText: { color: '#fff', fontSize: 15 },
  botText: { color: '#202124', fontSize: 15 },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  userTime: { color: 'rgba(255,255,255,0.7)' },
  botTime: { color: '#70757A' },
  typingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  typingText: { fontSize: 13, color: '#5F6368', marginLeft: 8 },
  chatInputWrapper: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#F1F3F4' },
  attachBtn: { marginRight: 8 },
  chatInputInner: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 5, borderWidth: 1, borderColor: '#DADCE0' },
  professionalInput: { flex: 1, fontSize: 16, minHeight: 40, maxHeight: 100 },
  sendCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1A73E8', justifyContent: 'center', alignItems: 'center' },
  sendDisabled: { backgroundColor: '#DADCE0' },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '70%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#202124' },
  historyList: { flex: 1 },
  historyItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#F1F3F4' },
  historyDate: { fontSize: 14, fontWeight: '600', color: '#202124' },
  historyPreview: { fontSize: 12, color: '#5F6368', marginTop: 2 },
  emptyHistory: { textAlign: 'center', marginTop: 50, color: '#999' }
});
