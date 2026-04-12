<template>
  <Transition name="panel-fade">
    <div v-if="visible" class="memory-overlay" @click.self="$emit('close')">
      <div class="memory-panel">
        <div class="panel-header">
          <h2>记忆管理</h2>
          <button class="close-btn" @click="$emit('close')">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-value">{{ totalMemories }}</span>
            <span class="stat-label">总记忆</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ categories.size }}</span>
            <span class="stat-label">分类</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ avgImportance.toFixed(1) }}</span>
            <span class="stat-label">平均重要性</span>
          </div>
        </div>
        
        <div class="filter-bar">
          <div class="category-filter">
            <button 
              v-for="cat in categoryOptions" 
              :key="cat.value"
              class="filter-btn"
              :class="{ active: selectedCategory === cat.value }"
              @click="selectedCategory = cat.value"
            >
              {{ cat.label }}
              <span class="count" v-if="cat.value === 'all'">{{ totalMemories }}</span>
              <span class="count" v-else-if="categoryCounts[cat.value]">{{ categoryCounts[cat.value] }}</span>
            </button>
          </div>
        </div>
        
        <div class="panel-content">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <span>加载中...</span>
          </div>
          
          <div v-else-if="filteredMemories.length === 0" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V13H11V7ZM11 15H13V17H11V15Z" fill="currentColor"/>
            </svg>
            <p>暂无记忆</p>
            <span>与 AI 对话时，她会自动记住你的喜好</span>
          </div>
          
          <div v-else class="memory-list">
            <TransitionGroup name="list-fade">
              <div 
                v-for="memory in filteredMemories" 
                :key="memory.id" 
                class="memory-card"
                :class="{ editing: editingId === memory.id }"
              >
                <div v-if="editingId !== memory.id" class="memory-content">
                  <div class="memory-header">
                    <span class="category-tag" :style="{ background: getCategoryColor(memory.category) }">
                      {{ getCategoryLabel(memory.category) }}
                    </span>
                    <div class="importance-bar">
                      <span 
                        v-for="i in 10" 
                        :key="i" 
                        class="importance-dot"
                        :class="{ filled: i <= memory.importance }"
                      ></span>
                    </div>
                  </div>
                  <p class="memory-text">{{ memory.content }}</p>
                  <div class="memory-footer">
                    <span class="memory-time">{{ formatTime(memory.createdAt) }}</span>
                    <div class="memory-actions">
                      <button class="action-btn edit" @click="startEdit(memory)" title="编辑">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <button class="action-btn delete" @click="deleteMemory(memory.id)" title="删除">
                        <svg viewBox="0 0 24 24" fill="none">
                          <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div v-else class="memory-edit">
                  <textarea v-model="editContent" class="edit-textarea" rows="3"></textarea>
                  <div class="edit-row">
                    <select v-model="editCategory" class="edit-select">
                      <option v-for="cat in categoryOptions.slice(1)" :key="cat.value" :value="cat.value">
                        {{ cat.label }}
                      </option>
                    </select>
                    <div class="importance-edit">
                      <span>重要性:</span>
                      <input type="range" v-model.number="editImportance" min="1" max="10" />
                      <span>{{ editImportance }}</span>
                    </div>
                  </div>
                  <div class="edit-actions">
                    <button class="btn btn-secondary" @click="cancelEdit">取消</button>
                    <button class="btn btn-primary" @click="saveEdit">保存</button>
                  </div>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </div>
        
        <div class="panel-footer">
          <button class="btn btn-danger" @click="confirmClearAll" :disabled="totalMemories === 0">
            清空所有记忆
          </button>
        </div>
      </div>
    </div>
  </Transition>
  
  <Transition name="modal-fade">
    <div v-if="showConfirm" class="confirm-modal" @click.self="showConfirm = false">
      <div class="confirm-content">
        <h3>确认清空</h3>
        <p>确定要清空所有记忆吗？此操作不可恢复。</p>
        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="showConfirm = false">取消</button>
          <button class="btn btn-danger" @click="clearAllMemories">确认清空</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { MemoryCategory, Memory, MemoryCategoryLabels } from '../lib/memory/memoryTypes';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
  cleared: [];
}>();

const memories = ref<Memory[]>([]);
const loading = ref(false);
const selectedCategory = ref<string>('all');
const editingId = ref<string | null>(null);
const editContent = ref('');
const editCategory = ref<MemoryCategory>(MemoryCategory.OTHER);
const editImportance = ref(5);
const showConfirm = ref(false);

const categoryOptions = [
  { value: 'all', label: '全部' },
  { value: MemoryCategory.PERSONAL_INFO, label: '个人信息' },
  { value: MemoryCategory.PREFERENCE, label: '喜好' },
  { value: MemoryCategory.DISLIKE, label: '不喜欢' },
  { value: MemoryCategory.HOBBY, label: '爱好' },
  { value: MemoryCategory.GOAL, label: '目标' },
  { value: MemoryCategory.EXPERIENCE, label: '经历' },
  { value: MemoryCategory.RELATIONSHIP, label: '关系' },
  { value: MemoryCategory.SCHEDULE, label: '日程' },
  { value: MemoryCategory.EMOTION, label: '情绪' },
  { value: MemoryCategory.OTHER, label: '其他' }
];

const totalMemories = computed(() => memories.value.length);

const categories = computed(() => {
  const cats = new Set<MemoryCategory>();
  memories.value.forEach(m => cats.add(m.category));
  return cats;
});

const categoryCounts = computed(() => {
  const counts: Record<string, number> = {};
  memories.value.forEach(m => {
    counts[m.category] = (counts[m.category] || 0) + 1;
  });
  return counts;
});

const avgImportance = computed(() => {
  if (memories.value.length === 0) return 0;
  const sum = memories.value.reduce((acc, m) => acc + m.importance, 0);
  return sum / memories.value.length;
});

const filteredMemories = computed(() => {
  if (selectedCategory.value === 'all') {
    return memories.value;
  }
  return memories.value.filter(m => m.category === selectedCategory.value);
});

const loadMemories = async () => {
  loading.value = true;
  try {
    if (window.electronAPI?.memory?.getAll) {
      const result = await window.electronAPI.memory.getAll();
      memories.value = result || [];
      memories.value.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    }
  } catch (error) {
    console.error('[MemoryPanel] 加载记忆失败:', error);
  } finally {
    loading.value = false;
  }
};

const getCategoryLabel = (category: MemoryCategory): string => {
  return MemoryCategoryLabels[category] || category;
};

const getCategoryColor = (category: MemoryCategory): string => {
  const colors: Record<MemoryCategory, string> = {
    [MemoryCategory.PERSONAL_INFO]: '#667eea',
    [MemoryCategory.PREFERENCE]: '#f59e0b',
    [MemoryCategory.DISLIKE]: '#ef4444',
    [MemoryCategory.HOBBY]: '#10b981',
    [MemoryCategory.GOAL]: '#8b5cf6',
    [MemoryCategory.EXPERIENCE]: '#06b6d4',
    [MemoryCategory.RELATIONSHIP]: '#ec4899',
    [MemoryCategory.SCHEDULE]: '#3b82f6',
    [MemoryCategory.EMOTION]: '#f97316',
    [MemoryCategory.OTHER]: '#6b7280'
  };
  return colors[category] || '#6b7280';
};

const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const startEdit = (memory: Memory) => {
  editingId.value = memory.id;
  editContent.value = memory.content;
  editCategory.value = memory.category;
  editImportance.value = memory.importance;
};

const cancelEdit = () => {
  editingId.value = null;
};

const saveEdit = async () => {
  if (!editingId.value || !editContent.value.trim()) return;
  
  try {
    if (window.electronAPI?.memory?.update) {
      await window.electronAPI.memory.update(editingId.value, {
        content: editContent.value.trim(),
        category: editCategory.value,
        importance: editImportance.value
      });
      
      const index = memories.value.findIndex(m => m.id === editingId.value);
      if (index !== -1) {
        memories.value[index] = {
          ...memories.value[index],
          content: editContent.value.trim(),
          category: editCategory.value,
          importance: editImportance.value
        };
      }
      
      editingId.value = null;
    }
  } catch (error) {
    console.error('[MemoryPanel] 保存编辑失败:', error);
  }
};

const deleteMemory = async (id: string) => {
  try {
    if (window.electronAPI?.memory?.delete) {
      await window.electronAPI.memory.delete(id);
      memories.value = memories.value.filter(m => m.id !== id);
    }
  } catch (error) {
    console.error('[MemoryPanel] 删除记忆失败:', error);
  }
};

const confirmClearAll = () => {
  showConfirm.value = true;
};

const clearAllMemories = async () => {
  try {
    if (window.electronAPI?.memory?.clearAll) {
      await window.electronAPI.memory.clearAll();
      memories.value = [];
      showConfirm.value = false;
      emit('cleared');
    }
  } catch (error) {
    console.error('[MemoryPanel] 清空记忆失败:', error);
  }
};

watch(() => props.visible, (visible) => {
  if (visible) {
    loadMemories();
  }
});

onMounted(() => {
  if (props.visible) {
    loadMemories();
  }
});
</script>

<style scoped>
.memory-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.memory-panel {
  background: linear-gradient(135deg, rgba(40, 40, 50, 0.98) 0%, rgba(30, 30, 40, 0.99) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 500px;
  max-width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 100, 100, 0.2);
}

.close-btn svg {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.7);
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.filter-bar {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  overflow-x: auto;
  flex-shrink: 0;
}

.filter-bar::-webkit-scrollbar {
  height: 4px;
}

.filter-bar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.category-filter {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
}

.filter-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.filter-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.filter-btn .count {
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 10px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  gap: 16px;
  color: rgba(255, 255, 255, 0.5);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  gap: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.empty-state svg {
  width: 48px;
  height: 48px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}

.empty-state span {
  font-size: 12px;
}

.memory-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.memory-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
}

.memory-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.memory-card.editing {
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
}

.memory-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.category-tag {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: white;
}

.importance-bar {
  display: flex;
  gap: 3px;
}

.importance-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.importance-dot.filled {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.memory-text {
  margin: 0 0 12px;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.9);
}

.memory-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.memory-time {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.memory-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn svg {
  width: 14px;
  height: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.action-btn:hover svg {
  color: rgba(255, 255, 255, 0.8);
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

.action-btn.delete:hover svg {
  color: #ef4444;
}

.memory-edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.edit-textarea {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.edit-textarea:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.5);
}

.edit-row {
  display: flex;
  gap: 16px;
  align-items: center;
}

.edit-select {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
}

.edit-select:focus {
  outline: none;
  border-color: rgba(102, 126, 234, 0.5);
}

.importance-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.importance-edit input {
  width: 80px;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.panel-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.confirm-content {
  background: linear-gradient(135deg, rgba(50, 50, 60, 0.98) 0%, rgba(40, 40, 50, 0.99) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 24px;
  max-width: 360px;
  text-align: center;
}

.confirm-content h3 {
  margin: 0 0 12px;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.95);
}

.confirm-content p {
  margin: 0 0 20px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: all 0.3s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
  opacity: 0;
}

.panel-fade-enter-from .memory-panel,
.panel-fade-leave-to .memory-panel {
  transform: scale(0.95) translateY(20px);
}

.list-fade-enter-active,
.list-fade-leave-active {
  transition: all 0.3s ease;
}

.list-fade-enter-from,
.list-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
