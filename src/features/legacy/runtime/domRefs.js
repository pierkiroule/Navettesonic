export function collectLegacyDomRefs() {
  const homeView = document.getElementById('homeView');
  const experienceModeView = document.getElementById('experienceModeView');
  const experienceView = document.getElementById('experienceView');
  const echoHypnoseView = document.getElementById('echoHypnoseView');
  const profileView = document.getElementById('profileView');
  const bottomNav = document.getElementById('bottomNav');
  const bottomNavToggle = document.getElementById('bottomNavToggle');
  const navHome = document.getElementById('navHome');
  const navSoon = document.getElementById('navSoon');
  const navProfile = document.getElementById('navProfile');
  const enterExperienceBtn = document.getElementById('enterExperienceBtn');
  const selectSoloModeBtn = document.getElementById('selectSoloModeBtn');
  const selectMultiModeBtn = document.getElementById('selectMultiModeBtn');
  const multiRoomComposer = document.getElementById('multiRoomComposer');
  const createMultiRoomBtn = document.getElementById('createMultiRoomBtn');
  const multiRoomLinkOutput = document.getElementById('multiRoomLinkOutput');
  const heroVideo = document.getElementById('heroVideo');
  const heroVideoShell = document.getElementById('heroVideoShell');
  const heroPlayBtn = document.getElementById('heroPlayBtn');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const ui = document.getElementById('ui');
  const helperTips = document.getElementById('helperTips');
  const soonTutoLink = document.getElementById('soonTutoLink');
  const soonTutoModal = document.getElementById('soonTutoModal');
  const soonTutoCloseBtn = document.getElementById('soonTutoCloseBtn');
  const silenceDesYeuxOverlay = document.getElementById('silenceDesYeuxOverlay');
  const silenceDesYeuxTitle = document.getElementById('silenceDesYeuxTitle');
  const silenceDesYeuxCountdown = document.getElementById('silenceDesYeuxCountdown');
  const silenceDesYeuxPoem = document.getElementById('silenceDesYeuxPoem');
  const echoRecorderPanel = document.getElementById('echoRecorderPanel');
  const echoRecordToggleBtn = document.getElementById('echoRecordToggleBtn');
  const echoRecordTimer = document.getElementById('echoRecordTimer');
  const echoRecordStatus = document.getElementById('echoRecordStatus');
  const echoRecordDownloadLink = document.getElementById('echoRecordDownloadLink');
  const traceListeningBtn = document.getElementById('traceListeningBtn');
  const traceCamControls = document.getElementById('traceCamControls');
  const silenceDesYeuxPrompt = document.getElementById('silenceDesYeuxPrompt');
  const silenceSaveNoBtn = document.getElementById('silenceSaveNoBtn');
  const silenceSaveYesBtn = document.getElementById('silenceSaveYesBtn');
  const bubblePanel = document.getElementById('bubblePanel');
  const cancelBtn = document.getElementById('cancelBtn');
  const dropBtn = document.getElementById('dropBtn');
  const bubbleLayer = document.getElementById('bubbleLayer');
  const bubbleHaloStyle = document.getElementById('bubbleHaloStyle');
  const sampleSelect = document.getElementById('sampleSelect');
  const sampleHint = document.getElementById('sampleHint');
  const arenaTrianglePad = document.getElementById('arenaTrianglePad');
  const arenaTriangleStatus = document.getElementById('arenaTriangleStatus');
  const bubblePropsPanel = document.getElementById('bubblePropsPanel');
  const propsBubbleName = document.getElementById('propsBubbleName');
  const propsSampleSelect = document.getElementById('propsSampleSelect');
  const propsSizeRange = document.getElementById('propsSizeRange');
  const propsSizeVal = document.getElementById('propsSizeVal');
  const colorSwatches = document.getElementById('colorSwatches');
  const propsLayerSelect = document.getElementById('propsLayerSelect');
  const propsHaloStyleSelect = document.getElementById('propsHaloStyleSelect');
  const propsDeleteBtn = document.getElementById('propsDeleteBtn');
  const propsCloseBtn = document.getElementById('propsCloseBtn');
  const supabaseUrlInput = document.getElementById('supabaseUrlInput');
  const supabaseKeyInput = document.getElementById('supabaseKeyInput');
  const supabaseSaveConfigBtn = document.getElementById('supabaseSaveConfigBtn');
  const supabaseTestBtn = document.getElementById('supabaseTestBtn');
  const supabaseFileInput = document.getElementById('supabaseFileInput');
  const supabaseUploadBtn = document.getElementById('supabaseUploadBtn');
  const supabaseProbeUrlInput = document.getElementById('supabaseProbeUrlInput');
  const supabaseProbeBtn = document.getElementById('supabaseProbeBtn');
  const supabaseStatus = document.getElementById('supabaseStatus');
  const supabaseUploadedLink = document.getElementById('supabaseUploadedLink');
  const supabaseProbeStatus = document.getElementById('supabaseProbeStatus');
  const authEmailInput = document.getElementById('authEmailInput');
  const authPasswordInput = document.getElementById('authPasswordInput');
  const authCredentialsBlock = document.getElementById('authCredentialsBlock');
  const authSignInBtn = document.getElementById('authSignInBtn');
  const authSignUpBtn = document.getElementById('authSignUpBtn');
  const authSignOutBtn = document.getElementById('authSignOutBtn');
  const authStatus = document.getElementById('authStatus');
  const authSessionInfo = document.getElementById('authSessionInfo');
  const createArenaBtn = document.getElementById('createArenaBtn');
  const inviteArenaBtn = document.getElementById('inviteArenaBtn');
  const joinArenaBtn = document.getElementById('joinArenaBtn');
  const arenaInviteCodeInput = document.getElementById('arenaInviteCodeInput');
  const arenaSessionStatus = document.getElementById('arenaSessionStatus');
  const arenaInvitePreview = document.getElementById('arenaInvitePreview');
  const arenaInvitePreviewCode = document.getElementById('arenaInvitePreviewCode');
  const arenaCopyInviteBtn = document.getElementById('arenaCopyInviteBtn');
  const arenaShareInviteBtn = document.getElementById('arenaShareInviteBtn');
  const arenaSessionBadge = document.getElementById('arenaSessionBadge');
  const arenaDebugLog = document.getElementById('arenaDebugLog');
  const profileDisplayName = document.getElementById('profileDisplayName');
  const profileBioText = document.getElementById('profileBioText');
  const profileEditBtn = document.getElementById('profileEditBtn');
  const profileEditPanel = document.getElementById('profileEditPanel');
  const profileNameInput = document.getElementById('profileNameInput');
  const profileBioInput = document.getElementById('profileBioInput');
  const profileSaveBtn = document.getElementById('profileSaveBtn');
  const profileCancelBtn = document.getElementById('profileCancelBtn');
  const dbConnectionStatus = document.getElementById('dbConnectionStatus');
  const storeCatalog = document.getElementById('storeCatalog');
  const sessionHistoryList = document.getElementById('sessionHistoryListLegacy');
  const silenceSessionList = document.getElementById('silenceSessionList');

  return {
    homeView, experienceModeView, experienceView, echoHypnoseView, profileView, bottomNav, bottomNavToggle,
    navHome, navSoon, navProfile, enterExperienceBtn, selectSoloModeBtn, selectMultiModeBtn, multiRoomComposer, createMultiRoomBtn, multiRoomLinkOutput, heroVideo, heroVideoShell, heroPlayBtn,
    canvas, ctx, ui, helperTips, soonTutoLink, soonTutoModal, soonTutoCloseBtn,
    silenceDesYeuxOverlay, silenceDesYeuxTitle, silenceDesYeuxCountdown, silenceDesYeuxPoem,
    echoRecorderPanel, echoRecordToggleBtn, echoRecordTimer, echoRecordStatus, echoRecordDownloadLink,
    traceListeningBtn, traceCamControls, silenceDesYeuxPrompt, silenceSaveNoBtn, silenceSaveYesBtn,
    bubblePanel, cancelBtn, dropBtn, bubbleLayer, bubbleHaloStyle, sampleSelect, sampleHint,
    arenaTrianglePad, arenaTriangleStatus, bubblePropsPanel, propsBubbleName, propsSampleSelect,
    propsSizeRange, propsSizeVal, colorSwatches, propsLayerSelect, propsHaloStyleSelect,
    propsDeleteBtn, propsCloseBtn, supabaseUrlInput, supabaseKeyInput, supabaseSaveConfigBtn,
    supabaseTestBtn, supabaseFileInput, supabaseUploadBtn, supabaseProbeUrlInput, supabaseProbeBtn,
    supabaseStatus, supabaseUploadedLink, supabaseProbeStatus, authEmailInput, authPasswordInput,
    authCredentialsBlock, authSignInBtn, authSignUpBtn, authSignOutBtn, authStatus, authSessionInfo,
    createArenaBtn, inviteArenaBtn, joinArenaBtn, arenaInviteCodeInput, arenaSessionStatus,
    arenaInvitePreview, arenaInvitePreviewCode, arenaCopyInviteBtn, arenaShareInviteBtn,
    arenaSessionBadge, arenaDebugLog, profileDisplayName, profileBioText, profileEditBtn,
    profileEditPanel, profileNameInput, profileBioInput, profileSaveBtn, profileCancelBtn,
    dbConnectionStatus, storeCatalog, sessionHistoryList, silenceSessionList,
  };
}
