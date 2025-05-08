import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// 遊戲主要變數
let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canJump = true, isJumping = false;
const objects = []; // 儲存場景中的物體
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// 射線檢測相關
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let currentIntersected = null;

// 物理相關常數
const GRAVITY = 0.2;
const JUMP_FORCE = 0.5;
const PLAYER_HEIGHT = 2;

// 手臂相關
let arm;

// 初始化遊戲
function init() {
    try {
        console.log('開始初始化遊戲...');
        
        // 創建場景
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // 天空藍

        // 設置相機
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.y = PLAYER_HEIGHT;

        // 設置渲染器
        const canvas = document.getElementById('game-canvas');
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);

        // 添加光源
        const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
        scene.add(light);

        // 創建地面
        createGround();

        // 添加一些方塊
        createCubes();

        // 添加樹木
        createTrees();

        // 設置控制器
        controls = new PointerLockControls(camera, document.body);
        console.log('控制器已設置:', controls);

        // 創建手臂
        createArm();

        // 事件監聽
        setupEventListeners();

        // 添加滑鼠點擊事件
        document.addEventListener('mousedown', onMouseDown);

        // 開始動畫循環
        animate();
    } catch (error) {
        console.error('初始化遊戲時發生錯誤:', error);
    }
}

// 創建地面
function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(200, 200); // 擴大地面大小
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x567d46 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    objects.push(ground);
}

// 創建方塊
function createCubes() {
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    // 增加方塊數量並擴大生成範圍
    for (let i = 0; i < 100; i++) {
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.x = Math.floor(Math.random() * 80 - 40); // 擴大 X 軸範圍
        cube.position.y = Math.floor(Math.random() * 3);
        cube.position.z = Math.floor(Math.random() * 80 - 40); // 擴大 Z 軸範圍
        scene.add(cube);
        objects.push(cube);
    }
}

// 創建樹木
function createTree(x, z) {
    // 創建樹幹
    const trunkGeometry = new THREE.BoxGeometry(1, 4, 1);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // 深棕色
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 2, z);
    scene.add(trunk);
    objects.push(trunk);

    // 創建樹葉
    const leavesGeometry = new THREE.BoxGeometry(3, 3, 3);
    const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // 森林綠
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 5, z);
    scene.add(leaves);
    objects.push(leaves);
}

// 在初始化時添加樹木
function createTrees() {
    // 增加樹木數量並擴大生成範圍
    for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * 80 - 40); // 擴大 X 軸範圍
        const z = Math.floor(Math.random() * 80 - 40); // 擴大 Z 軸範圍
        createTree(x, z);
    }
}

// 創建手臂
function createArm() {
    const armGeometry = new THREE.BoxGeometry(0.2, 0.2, 1);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xCCBBAA });
    arm = new THREE.Mesh(armGeometry, armMaterial);
    
    // 設置手臂位置
    arm.position.set(0.7, -0.5, -1);
    arm.rotation.y = Math.PI / 6;
    camera.add(arm);
}

// 設置事件監聽器
function setupEventListeners() {
    try {
        const startButton = document.getElementById('start-button');
        console.log('開始按鈕元素:', startButton);
        
        if (startButton) {
            startButton.addEventListener('click', () => {
                console.log('開始按鈕被點擊');
                controls.lock();
            });
        } else {
            console.error('找不到開始按鈕元素！');
        }

        controls.addEventListener('lock', () => {
            console.log('控制器已鎖定');
            document.getElementById('start-screen').style.display = 'none';
        });

        controls.addEventListener('unlock', () => {
            console.log('控制器已解鎖');
            document.getElementById('start-screen').style.display = 'block';
        });

        // 鍵盤控制
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        
        console.log('事件監聽器設置完成');
    } catch (error) {
        console.error('設置事件監聽器時發生錯誤:', error);
    }
}

// 滑鼠點擊事件處理
function onMouseDown(event) {
    if (!controls.isLocked) return;

    if (event.button === 0) { // 左鍵點擊
        const intersects = checkIntersection();
        if (intersects.length > 0) {
            const intersected = intersects[0];
            destroyBlock(intersected.object);
            
            // 播放手臂動畫
            playArmAnimation();
        }
    }
}

// 檢查射線相交
function checkIntersection() {
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    return raycaster.intersectObjects(objects.filter(obj => obj !== arm));
}

// 破壞方塊
function destroyBlock(block) {
    // 從場景和物件陣列中移除方塊
    scene.remove(block);
    const index = objects.indexOf(block);
    if (index > -1) {
        objects.splice(index, 1);
    }
}

// 播放手臂動畫
function playArmAnimation() {
    const startRotation = arm.rotation.x;
    const duration = 200; // 動畫持續時間（毫秒）
    const startTime = Date.now();

    function animateArm() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 簡單的揮動動畫
        arm.rotation.x = startRotation - Math.sin(progress * Math.PI) * 0.5;

        if (progress < 1) {
            requestAnimationFrame(animateArm);
        } else {
            arm.rotation.x = startRotation; // 重置位置
        }
    }

    animateArm();
}

// 按鍵按下
function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump) {
                velocity.y = JUMP_FORCE;
                canJump = false;
                isJumping = true;
            }
            break;
    }
}

// 按鍵放開
function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

// 更新移動
function updateMovement() {
    if (controls.isLocked) {
        const delta = 0.1;

        // 應用重力
        if (camera.position.y > PLAYER_HEIGHT || velocity.y > 0) {
            velocity.y -= GRAVITY;
            camera.position.y += velocity.y;
        } else {
            camera.position.y = PLAYER_HEIGHT;
            velocity.y = 0;
            canJump = true;
            isJumping = false;
        }

        velocity.x = 0;
        velocity.z = 0;

        if (moveForward) velocity.z = -delta;
        if (moveBackward) velocity.z = delta;
        if (moveLeft) velocity.x = -delta;
        if (moveRight) velocity.x = delta;

        controls.moveRight(velocity.x);
        controls.moveForward(velocity.z);
    }
}

// 動畫循環
function animate() {
    requestAnimationFrame(animate);
    updateMovement();

    // 更新射線檢測
    const intersects = checkIntersection();
    if (intersects.length > 0) {
        if (currentIntersected !== intersects[0].object) {
            // 當看向新的方塊時，可以在這裡添加醒目效果
            currentIntersected = intersects[0].object;
        }
    } else {
        currentIntersected = null;
    }

    renderer.render(scene, camera);
}

// 視窗大小調整
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 初始化遊戲
init();