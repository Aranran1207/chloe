<template>
  <div class="settings-window">
    <div class="grid-bg"></div>
    <div class="scanline"></div>
    
    <div class="settings-layout">
      <nav class="sidebar">
        <div class="sidebar-header">
          <div class="logo-glow">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-icon">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="logo-text">CHLOE</span>
        </div>
        
        <div class="nav-items">
          <button 
            class="nav-item" 
            :class="{ active: activeTab === 'general' }"
            @click="activeTab = 'general'"
          >
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5"/><path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <span>通用</span>
          </button>
          <button 
            class="nav-item" 
            :class="{ active: activeTab === 'model' }"
            @click="activeTab = 'model'"
          >
            <svg viewBox="0 0 24 24" fill="none"><path d="M16 3H21V8M21 3L14 10M8 21H3V16M3 21L10 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>模型</span>
          </button>
          <button 
            class="nav-item" 
            :class="{ active: activeTab === 'ai' }"
            @click="activeTab = 'ai'"
          >
            <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>
            <span>AI 引擎</span>
          </button>
          <button 
            class="nav-item" 
            :class="{ active: activeTab === 'memory' }"
            @click="activeTab = 'memory'"
          >
            <svg viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>记忆</span>
          </button>
        </div>
        
        <div class="sidebar-footer">
          <div class="version-tag">v1.6.0</div>
        </div>
      </nav>
      
      <main class="content-area">
        <header class="content-header">
          <h1 class="content-title">{{ tabTitles[activeTab] }}</h1>
          <button class="close-btn" @click="closeWindow">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </header>
        
        <div class="content-scroll">
          <!-- 通用设置 -->
          <div v-if="activeTab === 'general'" class="tab-content">
            <div class="card">
              <div class="card-header">
                <div class="card-icon accent-cyan">
                  <svg viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M8 21H16M12 17V21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div>
                  <h3 class="card-title">窗口设置</h3>
                  <p class="card-desc">调整应用窗口的尺寸和外观</p>
                </div>
              </div>
              <div class="card-body">
                <div class="form-row">
                  <div class="form-field">
                    <label class="field-label">宽度</label>
                    <div class="field-input-wrap">
                      <input type="text" :value="windowWidth" @input="windowWidth = parseInt(($event.target as HTMLInputElement).value) || 500" class="field-input" />
                      <span class="field-suffix">px</span>
                    </div>
                  </div>
                  <div class="form-field">
                    <label class="field-label">高度</label>
                    <div class="field-input-wrap">
                      <input type="text" :value="windowHeight" @input="windowHeight = parseInt(($event.target as HTMLInputElement).value) || 800" class="field-input" />
                      <span class="field-suffix">px</span>
                    </div>
                  </div>
                </div>
                <p class="field-hint">范围: 300×500 ~ 800×1200</p>
              </div>
            </div>
            
            <div class="card">
              <div class="card-header">
                <div class="card-icon accent-purple">
                  <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </div>
                <div>
                  <h3 class="card-title">气泡颜色</h3>
                  <p class="card-desc">自定义对话气泡的显示颜色</p>
                </div>
              </div>
              <div class="card-body">
                <div class="color-picker-row">
                  <input type="color" v-model="bubbleColor" class="native-color-picker" />
                  <div class="color-swatch" :style="{ background: bubbleColor }"></div>
                  <span class="color-hex">{{ bubbleColor.toUpperCase() }}</span>
                  <div class="color-presets">
                    <div v-for="c in presetColors" :key="c" class="color-preset" :class="{ active: bubbleColor === c }" :style="{ background: c }" @click="bubbleColor = c"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="card">
              <div class="card-header">
                <div class="card-icon accent-cyan">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>
                </div>
                <div>
                  <h3 class="card-title">交互设置</h3>
                  <p class="card-desc">控制鼠标和窗口的交互行为</p>
                </div>
              </div>
              <div class="card-body">
                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-name">注视鼠标</span>
                    <span class="toggle-desc">模型眼睛跟随鼠标移动</span>
                  </div>
                  <label class="cyber-toggle">
                    <input type="checkbox" v-model="eyeTracking" />
                    <span class="toggle-track"><span class="toggle-knob"></span></span>
                  </label>
                </div>
                <div class="toggle-row">
                  <div class="toggle-info">
                    <span class="toggle-name">鼠标穿透</span>
                    <span class="toggle-desc">开启后鼠标可穿透窗口</span>
                  </div>
                  <label class="cyber-toggle">
                    <input type="checkbox" v-model="ignoreMouseEvents" />
                    <span class="toggle-track"><span class="toggle-knob"></span></span>
                  </label>
                </div>
              </div>
            </div>
            
            <div class="card">
              <div class="card-header">
                <div class="card-icon accent-pink">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div>
                  <h3 class="card-title">角色设定</h3>
                  <p class="card-desc">自定义 AI 女友的名字和性格</p>
                </div>
              </div>
              <div class="card-body">
                <div class="form-field full">
                  <label class="field-label">女友名字</label>
                  <input v-model="girlfriendName" type="text" class="field-input" placeholder="给女友起个名字吧~" maxlength="20" />
                </div>
                <div class="form-field full" style="margin-top: 14px;">
                  <label class="field-label">角色设定</label>
                  <textarea v-model="systemPrompt" class="field-textarea" placeholder="定义角色的性格、说话风格等，留空使用默认设定..." rows="4"></textarea>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 模型设置 -->
          <div v-if="activeTab === 'model'" class="tab-content">
            <div class="card">
              <div class="card-header">
                <div class="card-icon accent-cyan">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div>
                  <h3 class="card-title">模型路径</h3>
                  <p class="card-desc">指定 Live2D 模型文件夹的位置</p>
                </div>
              </div>
              <div class="card-body">
                <div class="input-with-btn">
                  <input v-model="modelPath" type="text" class="field-input" placeholder="请输入模型文件夹路径" />
                  <button class="glow-btn" @click="browseFolder">
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M22 19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21H4C3.46957 21 2.96086 20.7893 2.58579 20.4142C2.21071 20.0391 2 19.5304 2 19V5C2 4.46957 2.21071 3.96086 2.58579 3.58579C2.96086 3.21071 3.46957 3 4 3H9L11 6H20C20.5304 6 21.0391 6.21071 21.4142 6.58579C21.7893 6.96086 22 7.46957 22 8V19Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span>浏览</span>
                  </button>
                </div>
                <p class="field-hint">例如: ./resources/ 或 D:/Live2D/models/</p>
              </div>
            </div>
            
            <div class="card">
              <div class="card-header">
                <div class="card-icon accent-purple">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="1.5"/><path d="M12 7V12L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </div>
                <div>
                  <h3 class="card-title">模型变换</h3>
                  <p class="card-desc">调整模型在窗口中的位置和大小</p>
                </div>
              </div>
              <div class="card-body">
                <div class="slider-field">
                  <div class="slider-header">
                    <span class="slider-label">缩放比例</span>
                    <span class="slider-val">{{ modelScale.toFixed(1) }}x</span>
                  </div>
                  <input type="range" v-model.number="modelScale" min="0.5" max="2.0" step="0.1" class="cyber-slider" />
                </div>
                <div class="slider-field">
                  <div class="slider-header">
                    <span class="slider-label">水平偏移</span>
                    <span class="slider-val">{{ modelOffsetX.toFixed(1) }}</span>
                  </div>
                  <input type="range" v-model.number="modelOffsetX" min="-2.0" max="2.0" step="0.1" class="cyber-slider" />
                </div>
                <div class="slider-field">
                  <div class="slider-header">
                    <span class="slider-label">垂直偏移</span>
                    <span class="slider-val">{{ modelOffsetY.toFixed(1) }}</span>
                  </div>
                  <input type="range" v-model.number="modelOffsetY" min="-1.0" max="1.0" step="0.1" class="cyber-slider" />
                </div>
              </div>
            </div>
          </div>
          
          <!-- AI 引擎设置 -->
          <div v-if="activeTab === 'ai'" class="tab-content">
            <div class="card">
              <div class="card-header">
                <div class="card-icon accent-cyan">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>
                </div>
                <div>
                  <h3 class="card-title">推理引擎</h3>
                  <p class="card-desc">选择 AI 模型服务的运行方式</p>
                </div>
              </div>
              <div class="card-body">
                <div class="provider-tabs">
                  <button class="provider-tab" :class="{ active: aiProviderType === 'ollama' }" @click="aiProviderType = 'ollama'">
                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M3 21H21M5 21V7L12 3L19 7V21M9 21V15H15V21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <div class="provider-tab-info">
                      <span class="provider-tab-name">本地 Ollama</span>
                      <span class="provider-tab-status" :class="{ online: ollamaAvailable }">
                        <span class="status-dot"></span>
                        {{ ollamaAvailable ? '在线' : '离线' }}
                      </span>
                    </div>
                  </button>
                  <button class="provider-tab" :class="{ active: aiProviderType === 'openai' }" @click="aiProviderType = 'openai'">
                    <svg viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M21 16V8C20.9996 7.6439 20.9043 7.29443 20.7241 6.98807C20.5439 6.68172 20.2854 6.43005 19.975 6.25998L13.975 2.72998C13.6654 2.56039 13.3158 2.47095 12.96 2.47095C12.6043 2.47095 12.2546 2.56039 11.945 2.72998L5.945 6.25998C5.63458 6.43005 5.37611 6.68172 5.19593 6.98807C5.01575 7.29443 4.9204 7.6439 4.92 8V16C4.9204 16.3561 5.01575 16.7056 5.19593 17.0119C5.37611 17.3183 5.63458 17.57 5.945 17.74L11.945 21.27C12.2546 21.4396 12.6043 21.529 12.96 21.529C13.3158 21.529 13.6654 21.4396 13.975 21.27L19.975 17.74C20.2854 17.57 20.5439 17.3183 20.7241 17.0119C20.9043 16.7056 20.9996 16.3561 21 16Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <div class="provider-tab-info">
                      <span class="provider-tab-name">云端 API</span>
                      <span class="provider-tab-status" :class="{ online: openaiAvailable }">
                        <span class="status-dot"></span>
                        {{ openaiAvailable ? '已配置' : '未配置' }}
                      </span>
                    </div>
                  </button>
                </div>
                
                <div class="provider-form" v-if="aiProviderType === 'ollama'">
                  <div class="form-field full">
                    <label class="field-label">API 地址</label>
                    <input v-model="ollamaApiUrl" type="text" class="field-input mono" placeholder="http://localhost:11434" />
                  </div>
                  <div class="form-row">
                    <div class="form-field">
                      <label class="field-label">聊天模型</label>
                      <input v-model="ollamaChatModel" type="text" class="field-input mono" placeholder="qwen3.5:9b" />
                    </div>
                    <div class="form-field">
                      <label class="field-label">嵌入模型</label>
                      <input v-model="ollamaEmbeddingModel" type="text" class="field-input mono" placeholder="nomic-embed-text-v2-moe" />
                    </div>
                  </div>
                  <div class="info-banner">
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    <span>本地推理，无需联网，数据不出本机</span>
                  </div>
                </div>
                
                <div class="provider-form" v-if="aiProviderType === 'openai'">
                  <div class="form-field full">
                    <label class="field-label">API 地址</label>
                    <input v-model="openaiApiUrl" type="text" class="field-input mono" placeholder="https://api.openai.com/v1" />
                  </div>
                  <div class="form-field full">
                    <label class="field-label">API Key</label>
                    <input v-model="openaiApiKey" type="password" class="field-input mono" placeholder="sk-..." />
                  </div>
                  <div class="form-row">
                    <div class="form-field">
                      <label class="field-label">聊天模型</label>
                      <input v-model="openaiChatModel" type="text" class="field-input mono" placeholder="gpt-4o-mini" />
                    </div>
                    <div class="form-field">
                      <label class="field-label">嵌入模型</label>
                      <input v-model="openaiEmbeddingModel" type="text" class="field-input mono" placeholder="text-embedding-3-small" />
                    </div>
                  </div>
                  <div class="info-banner warn">
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M10.29 3.86L1.82 18C1.64527 18.3024 1.55265 18.6453 1.55143 18.9943C1.55022 19.3434 1.64045 19.6869 1.81304 19.9905C1.98563 20.2941 2.23477 20.5474 2.53573 20.7251C2.83669 20.9029 3.17898 20.999 3.528 21H20.47C20.819 20.999 21.1613 20.9029 21.4623 20.7251C21.7632 20.5474 22.0124 20.2941 22.185 19.9905C22.3575 19.6869 22.4478 19.3434 22.4466 18.9943C22.4453 18.6453 22.3527 18.3024 22.178 18L13.71 3.86C13.5374 3.56254 13.2892 3.31689 12.9903 3.14751C12.6915 2.97814 12.3527 2.89111 12.0085 2.89551C11.6643 2.89991 11.3279 2.99558 11.0335 3.1723C10.7391 3.34902 10.4976 3.60065 10.333 3.901L10.29 3.86Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9V13M12 17H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                    <span>需要联网，API Key 将保存在本地配置文件中</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 记忆设置 -->
          <div v-if="activeTab === 'memory'" class="tab-content">
            <div class="card">
              <div class="card-header">
                <div class="card-icon accent-purple">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div>
                  <h3 class="card-title">记忆存储</h3>
                  <p class="card-desc">管理 AI 保存的关于你的记忆</p>
                </div>
              </div>
              <div class="card-body">
                <div class="memory-display">
                  <div class="memory-counter">
                    <span class="counter-value">{{ memoryCount }}</span>
                    <span class="counter-label">条记忆</span>
                  </div>
                  <button class="danger-btn" @click="clearMemories" :disabled="memoryCount === 0">
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M3 6H5H21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span>清空全部</span>
                  </button>
                </div>
                <div class="info-banner">
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5"/><path d="M12 16V12M12 8H12.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <span>AI 会自动在对话中记录你的喜好和个人信息</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <footer class="content-footer">
          <button class="ghost-btn" @click="closeWindow">取消</button>
          <button class="primary-btn" @click="saveSettings">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <span>保存设置</span>
          </button>
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { saveProviderConfig } from '../lib/chatService';

const activeTab = ref<'general' | 'model' | 'ai' | 'memory'>('general');

const tabTitles: Record<string, string> = {
  general: '通用设置',
  model: '模型配置',
  ai: 'AI 引擎',
  memory: '记忆管理'
};

const presetColors = ['#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#f97316'];

const modelPath = ref('./resources/');
const modelScale = ref(1.0);
const modelOffsetX = ref(0.0);
const modelOffsetY = ref(-0.3);
const bubbleColor = ref('#8b5cf6');
const eyeTracking = ref(true);
const ignoreMouseEvents = ref(false);
const systemPrompt = ref('');
const girlfriendName = ref('');
const windowWidth = ref(500);
const windowHeight = ref(800);
const memoryCount = ref(0);

const aiProviderType = ref<'ollama' | 'openai'>('ollama');
const ollamaApiUrl = ref('http://localhost:11434');
const ollamaChatModel = ref('qwen3.5:9b');
const ollamaEmbeddingModel = ref('nomic-embed-text-v2-moe:latest');
const openaiApiUrl = ref('https://api.openai.com/v1');
const openaiApiKey = ref('');
const openaiChatModel = ref('gpt-4o-mini');
const openaiEmbeddingModel = ref('text-embedding-3-small');
const ollamaAvailable = ref(false);
const openaiAvailable = ref(false);

const loadConfig = async () => {
  if (window.electronAPI) {
    const config = await window.electronAPI.getConfig();
    if (config.modelPath) {
      let path = config.modelPath;
      if (!path.endsWith('/') && !path.endsWith('\\')) {
        path += '/';
      }
      modelPath.value = path;
    }
    if (config.modelScale !== undefined) modelScale.value = config.modelScale;
    if (config.modelOffsetX !== undefined) modelOffsetX.value = config.modelOffsetX;
    if (config.modelOffsetY !== undefined) modelOffsetY.value = config.modelOffsetY;
    if (config.bubbleColor !== undefined) bubbleColor.value = config.bubbleColor;
    if (config.eyeTracking !== undefined) eyeTracking.value = config.eyeTracking;
    if (config.ignoreMouseEvents !== undefined) ignoreMouseEvents.value = config.ignoreMouseEvents;
    if (config.systemPrompt !== undefined) systemPrompt.value = config.systemPrompt;
    if (config.girlfriendName !== undefined) girlfriendName.value = config.girlfriendName;
    if (config.windowWidth !== undefined) windowWidth.value = config.windowWidth;
    if (config.windowHeight !== undefined) windowHeight.value = config.windowHeight;
    
    if (config.aiProvider) {
      aiProviderType.value = config.aiProvider.type || 'ollama';
      if (config.aiProvider.type === 'ollama') {
        ollamaApiUrl.value = config.aiProvider.apiUrl || 'http://localhost:11434';
        ollamaChatModel.value = config.aiProvider.chatModel || 'qwen3.5:9b';
        ollamaEmbeddingModel.value = config.aiProvider.embeddingModel || 'nomic-embed-text-v2-moe:latest';
      } else if (config.aiProvider.type === 'openai') {
        openaiApiUrl.value = config.aiProvider.apiUrl || 'https://api.openai.com/v1';
        openaiApiKey.value = config.aiProvider.apiKey || '';
        openaiChatModel.value = config.aiProvider.chatModel || 'gpt-4o-mini';
        openaiEmbeddingModel.value = config.aiProvider.embeddingModel || 'text-embedding-3-small';
      }
      localStorage.setItem('aiProviderConfig', JSON.stringify(config.aiProvider));
    }
  }
};

const loadMemoryCount = async () => {
  if (window.electronAPI?.memory) {
    try {
      const stats = await window.electronAPI.memory.getStats();
      memoryCount.value = stats.totalMemories || 0;
    } catch (error) {
      console.warn('[SettingsWindow] 获取记忆统计失败:', error);
    }
  }
};

const checkProviderAvailability = async () => {
  let ollamaUrl = ollamaApiUrl.value;
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    ollamaAvailable.value = response.ok;
  } catch {
    ollamaAvailable.value = false;
  }
  openaiAvailable.value = !!openaiApiKey.value;
};

const browseFolder = async () => {
  if (window.electronAPI?.openFolderDialog) {
    const result = await window.electronAPI.openFolderDialog();
    if (result && !result.canceled && result.filePaths.length > 0) {
      modelPath.value = result.filePaths[0];
    }
  }
};

const clearMemories = async () => {
  if (window.electronAPI?.memory?.clearAll) {
    try {
      const result = await window.electronAPI.memory.clearAll();
      if (result.success) {
        memoryCount.value = 0;
        console.log('[SettingsWindow] 已清空所有记忆');
      }
    } catch (error) {
      console.error('[SettingsWindow] 清空记忆失败:', error);
    }
  }
};

const saveSettings = async () => {
  const clampedWidth = Math.max(300, Math.min(800, windowWidth.value || 500));
  const clampedHeight = Math.max(500, Math.min(1200, windowHeight.value || 800));
  
  let normalizedPath = modelPath.value;
  if (!normalizedPath.endsWith('/') && !normalizedPath.endsWith('\\')) {
    normalizedPath += '/';
  }
  
  const aiConfig = aiProviderType.value === 'ollama' ? {
    type: 'ollama' as const,
    apiUrl: ollamaApiUrl.value,
    chatModel: ollamaChatModel.value,
    embeddingModel: ollamaEmbeddingModel.value
  } : {
    type: 'openai' as const,
    apiUrl: openaiApiUrl.value,
    apiKey: openaiApiKey.value,
    chatModel: openaiChatModel.value,
    embeddingModel: openaiEmbeddingModel.value
  };
  
  saveProviderConfig(aiConfig);
  
  if (window.electronAPI) {
    await window.electronAPI.setConfig({
      modelPath: normalizedPath,
      modelScale: modelScale.value,
      modelOffsetX: modelOffsetX.value,
      modelOffsetY: modelOffsetY.value,
      bubbleColor: bubbleColor.value,
      eyeTracking: eyeTracking.value,
      ignoreMouseEvents: ignoreMouseEvents.value,
      systemPrompt: systemPrompt.value,
      girlfriendName: girlfriendName.value,
      windowWidth: clampedWidth,
      windowHeight: clampedHeight
    });
    
    window.electronAPI.setIgnoreMouseEvents(ignoreMouseEvents.value);
    window.electronAPI.send('settings-saved', {});
  }
  
  closeWindow();
};

const closeWindow = () => {
  if (window.electronAPI) {
    window.electronAPI.closeSettingsWindow();
  }
};

onMounted(async () => {
  await loadConfig();
  loadMemoryCount();
  checkProviderAvailability();
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

.settings-window {
  width: 100vw;
  height: 100vh;
  background: rgba(8, 11, 20, 0.75);
  backdrop-filter: blur(40px) saturate(150%);
  -webkit-backdrop-filter: blur(40px) saturate(150%);
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  color: #e2e8f0;
}

.grid-bg {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}

.scanline {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  pointer-events: none;
  z-index: 100;
}

.settings-layout {
  display: flex;
  height: 100%;
  position: relative;
  z-index: 1;
}

/* ====== SIDEBAR ====== */
.sidebar {
  width: 80px;
  background: rgba(8, 11, 20, 0.95);
  border-right: 1px solid rgba(6, 182, 212, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  -webkit-app-region: drag;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin-bottom: 30px;
}

.logo-glow {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.2);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.15);
}

.logo-icon {
  width: 22px;
  height: 22px;
  color: #06b6d4;
}

.logo-text {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 3px;
  color: rgba(6, 182, 212, 0.7);
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.nav-item {
  width: 56px;
  height: 56px;
  border: none;
  background: transparent;
  border-radius: 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.25s ease;
  color: rgba(148, 163, 184, 0.6);
  -webkit-app-region: no-drag;
}

.nav-item svg {
  width: 20px;
  height: 20px;
}

.nav-item span {
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.nav-item:hover {
  background: rgba(6, 182, 212, 0.06);
  color: rgba(6, 182, 212, 0.7);
}

.nav-item.active {
  background: rgba(6, 182, 212, 0.12);
  color: #06b6d4;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.1), inset 0 0 20px rgba(6, 182, 212, 0.05);
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.sidebar-footer {
  margin-top: auto;
}

.version-tag {
  font-size: 9px;
  color: rgba(100, 116, 139, 0.5);
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 1px;
}

/* ====== CONTENT AREA ====== */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(8, 11, 20, 0.6) 0%, rgba(8, 11, 20, 0.9) 100%);
  -webkit-app-region: drag;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 28px;
  border-bottom: 1px solid rgba(6, 182, 212, 0.08);
  -webkit-app-region: drag;
}

.content-title {
  font-size: 18px;
  font-weight: 600;
  color: #f1f5f9;
  letter-spacing: 0.5px;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(148, 163, 184, 0.04);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  -webkit-app-region: no-drag;
}

.close-btn svg {
  width: 14px;
  height: 14px;
  color: rgba(148, 163, 184, 0.5);
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
}

.close-btn:hover svg {
  color: #f87171;
}

.content-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px;
  -webkit-app-region: no-drag;
}

.content-scroll::-webkit-scrollbar {
  width: 4px;
}

.content-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.content-scroll::-webkit-scrollbar-thumb {
  background: rgba(6, 182, 212, 0.15);
  border-radius: 4px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ====== CARDS ====== */
.card {
  background: rgba(15, 20, 35, 0.7);
  border: 1px solid rgba(6, 182, 212, 0.08);
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  transition: border-color 0.3s;
}

.card:hover {
  border-color: rgba(6, 182, 212, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.06);
}

.card-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.card-icon svg {
  width: 20px;
  height: 20px;
}

.card-icon.accent-cyan {
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.2);
  color: #06b6d4;
}

.card-icon.accent-purple {
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.card-icon.accent-pink {
  background: rgba(236, 72, 153, 0.1);
  border: 1px solid rgba(236, 72, 153, 0.2);
  color: #f472b6;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.card-desc {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.6);
  margin: 2px 0 0;
}

.card-body {
  padding: 18px 20px;
}

/* ====== FORM ELEMENTS ====== */
.form-row {
  display: flex;
  gap: 14px;
}

.form-field {
  flex: 1;
}

.form-field.full {
  width: 100%;
}

.field-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: rgba(148, 163, 184, 0.7);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-input-wrap {
  display: flex;
  align-items: center;
  background: rgba(8, 11, 20, 0.6);
  border: 1px solid rgba(6, 182, 212, 0.1);
  border-radius: 10px;
  padding: 0 12px;
  transition: all 0.25s;
}

.field-input-wrap:focus-within {
  border-color: rgba(6, 182, 212, 0.3);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.06), 0 0 20px rgba(6, 182, 212, 0.05);
}

.field-input {
  width: 100%;
  padding: 10px 12px;
  background: rgba(8, 11, 20, 0.6);
  border: 1px solid rgba(6, 182, 212, 0.1);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.25s;
  box-sizing: border-box;
}

.field-input.mono {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.field-input:focus {
  outline: none;
  border-color: rgba(6, 182, 212, 0.3);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.06), 0 0 20px rgba(6, 182, 212, 0.05);
  background: rgba(8, 11, 20, 0.8);
}

.field-input::placeholder {
  color: rgba(100, 116, 139, 0.4);
}

.field-suffix {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.4);
  font-family: 'JetBrains Mono', monospace;
  min-width: 20px;
}

.field-textarea {
  width: 100%;
  padding: 10px 12px;
  background: rgba(8, 11, 20, 0.6);
  border: 1px solid rgba(6, 182, 212, 0.1);
  border-radius: 10px;
  color: #e2e8f0;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all 0.25s;
  box-sizing: border-box;
  line-height: 1.6;
}

.field-textarea:focus {
  outline: none;
  border-color: rgba(6, 182, 212, 0.3);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.06), 0 0 20px rgba(6, 182, 212, 0.05);
  background: rgba(8, 11, 20, 0.8);
}

.field-textarea::placeholder {
  color: rgba(100, 116, 139, 0.4);
}

.field-hint {
  margin: 8px 0 0;
  font-size: 11px;
  color: rgba(100, 116, 139, 0.5);
}

.input-with-btn {
  display: flex;
  gap: 10px;
}

.input-with-btn .field-input {
  flex: 1;
}

/* ====== GLOW BUTTON ====== */
.glow-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.25);
  border-radius: 10px;
  color: #06b6d4;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s;
  white-space: nowrap;
}

.glow-btn:hover {
  background: rgba(6, 182, 212, 0.18);
  border-color: rgba(6, 182, 212, 0.4);
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.15);
}

/* ====== SLIDER ====== */
.slider-field {
  margin-bottom: 18px;
}

.slider-field:last-child {
  margin-bottom: 0;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.slider-label {
  font-size: 12px;
  font-weight: 500;
  color: rgba(148, 163, 184, 0.8);
}

.slider-val {
  font-size: 12px;
  font-weight: 600;
  color: #06b6d4;
  font-family: 'JetBrains Mono', monospace;
  background: rgba(6, 182, 212, 0.08);
  padding: 2px 10px;
  border-radius: 6px;
  border: 1px solid rgba(6, 182, 212, 0.15);
}

.cyber-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(6, 182, 212, 0.08);
  border-radius: 10px;
  outline: none;
  cursor: pointer;
  margin: 0;
}

.cyber-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: #06b6d4;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.2);
  margin-top: -6px;
}

.cyber-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.6), 0 0 30px rgba(6, 182, 212, 0.3);
}

.cyber-slider::-webkit-slider-runnable-track {
  height: 6px;
  border-radius: 10px;
}

/* ====== CYBER TOGGLE ====== */
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
}

.toggle-row + .toggle-row {
  border-top: 1px solid rgba(148, 163, 184, 0.06);
}

.toggle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-name {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
}

.toggle-desc {
  font-size: 11px;
  color: rgba(148, 163, 184, 0.5);
}

.cyber-toggle {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.cyber-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.toggle-track {
  display: block;
  width: 44px;
  height: 24px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.2);
  border-radius: 24px;
  transition: all 0.3s ease;
  position: relative;
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: rgba(148, 163, 184, 0.8);
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.cyber-toggle input:checked + .toggle-track {
  background: rgba(6, 182, 212, 0.2);
  border-color: rgba(6, 182, 212, 0.4);
  box-shadow: 0 0 15px rgba(6, 182, 212, 0.15);
}

.cyber-toggle input:checked + .toggle-track .toggle-knob {
  transform: translateX(20px);
  background: #06b6d4;
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.5);
}

/* ====== COLOR PICKER ====== */
.color-picker-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.native-color-picker {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  padding: 0;
}

.native-color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.native-color-picker::-webkit-color-swatch {
  border: 2px solid rgba(6, 182, 212, 0.2);
  border-radius: 8px;
}

.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(6, 182, 212, 0.15);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
}

.color-hex {
  font-size: 12px;
  color: rgba(148, 163, 184, 0.7);
  font-family: 'JetBrains Mono', monospace;
  min-width: 64px;
}

.color-presets {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.color-preset {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.color-preset:hover {
  transform: scale(1.15);
}

.color-preset.active {
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

/* ====== PROVIDER TABS ====== */
.provider-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.provider-tab {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(15, 20, 35, 0.6);
  border: 1px solid rgba(100, 116, 139, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  color: rgba(148, 163, 184, 0.6);
}

.provider-tab:hover {
  border-color: rgba(100, 116, 139, 0.2);
  background: rgba(15, 20, 35, 0.8);
}

.provider-tab.active {
  border-color: rgba(6, 182, 212, 0.3);
  background: rgba(6, 182, 212, 0.06);
  color: #06b6d4;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.08);
}

.provider-tab-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.provider-tab-name {
  font-size: 13px;
  font-weight: 600;
  color: inherit;
}

.provider-tab-status {
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(148, 163, 184, 0.5);
}

.provider-tab-status .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.3);
}

.provider-tab-status.online .status-dot {
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

.provider-tab-status.online {
  color: #10b981;
}

.provider-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ====== INFO BANNER ====== */
.info-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(6, 182, 212, 0.06);
  border: 1px solid rgba(6, 182, 212, 0.12);
  border-radius: 10px;
  color: rgba(6, 182, 212, 0.8);
  font-size: 12px;
}

.info-banner.warn {
  background: rgba(245, 158, 11, 0.06);
  border-color: rgba(245, 158, 11, 0.12);
  color: rgba(245, 158, 11, 0.8);
}

/* ====== MEMORY DISPLAY ====== */
.memory-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(8, 11, 20, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.1);
  border-radius: 12px;
  margin-bottom: 12px;
}

.memory-counter {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.counter-value {
  font-size: 28px;
  font-weight: 700;
  color: #a78bfa;
  font-family: 'JetBrains Mono', monospace;
  text-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
}

.counter-label {
  font-size: 13px;
  color: rgba(148, 163, 184, 0.6);
}

.danger-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 10px;
  color: #f87171;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.danger-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.35);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.1);
}

.danger-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ====== FOOTER ====== */
.content-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 28px;
  border-top: 1px solid rgba(6, 182, 212, 0.08);
  -webkit-app-region: no-drag;
}

.ghost-btn {
  padding: 10px 20px;
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 10px;
  color: rgba(148, 163, 184, 0.7);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.ghost-btn:hover {
  background: rgba(148, 163, 184, 0.06);
  border-color: rgba(148, 163, 184, 0.25);
  color: #e2e8f0;
}

.primary-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.9) 0%, rgba(6, 182, 212, 0.7) 100%);
  border: 1px solid rgba(6, 182, 212, 0.4);
  border-radius: 10px;
  color: #080b14;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
}

.primary-btn:hover {
  background: linear-gradient(135deg, rgba(6, 182, 212, 1) 0%, rgba(6, 182, 212, 0.85) 100%);
  box-shadow: 0 0 30px rgba(6, 182, 212, 0.3);
  transform: translateY(-1px);
}

.primary-btn svg {
  width: 16px;
  height: 16px;
}
</style>
