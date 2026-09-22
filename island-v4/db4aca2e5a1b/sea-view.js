/* Derived navigation/public-state logic from the verified SeaView; V4 presentation is local only. */
function V4SeaView({ me, entries, reward, arrive, onBack, onHome, onGo, onTour, tutOn }) {
  const hostRef = useRef(null);
  // 투어(2026-09-15): tutOn이면 렌더 루프가 오늘의 섬 상자를 매 프레임 투영해 앵커 div(sea-isle)에 쓴다 — 카메라가 움직이는 화면이라 리사이즈만이 아니라 끌기·항해·확대 때마다 바뀐다
  const tutOnRef = useRef(false); tutOnRef.current = !!tutOn;
  const todayRef = useRef(null);
  const seaAnchorRef = useRef(null);
  const [tutSeen, setTutSeen] = useState(function () { try { return localStorage.getItem("tutSea") === "1"; } catch (e) { return false; } });
  const [fps, setFps] = useState(0);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState("친구 섬을 찾는 중…");
  const [names, setNames] = useState([]);        // [{id, name}] 명단(이름순)
  const [q, setQ] = useState("");                // 검색어
  const [listOpen, setListOpen] = useState(false);
  const [sel, setSel] = useState(null);          // 고른 섬 {id, name}
  const [sailing, setSailing] = useState(null);  // 항해 중 {name}
  const [reveal, setReveal] = useState(!!arrive);  // 부두 덮개가 걷히는 연출
  const [cover, setCover] = useState(false);       // 친구 섬에 내릴 때 덮개
  const [todayIsle, setTodayIsle] = useState(null); // 오늘의 섬 {id, name}
  todayRef.current = todayIsle;
  const [small, setSmall] = useState(function () {
    try { return window.innerWidth < 560; } catch (e) { return false; }
  });
  const api = useRef({});
  const arriveRef = useRef(arrive);
  const cards = seaOpts();
  const touch = coarsePointer();
  const seed = String(me.id || me.name || "island");
  useEffect(function () {
    function onR() { try { setSmall(window.innerWidth < 560); } catch (e) {} }
    window.addEventListener("resize", onR);
    window.addEventListener("orientationchange", onR);
    // 섬 화면의 덮개가 오른쪽에서 들어왔으니 여기서는 같은 방향으로 걷힌다.
    var tm = reveal ? window.setTimeout(function () { setReveal(false); }, 800) : 0;
    return function () {
      window.removeEventListener("resize", onR);
      window.removeEventListener("orientationchange", onR);
      if (tm) window.clearTimeout(tm);
    };
  }, []);
  useEffect(function () {
    var host = hostRef.current;
    if (!host) return;
    if (typeof THREE === "undefined") { setErr("3D 라이브러리를 불러오지 못했어요."); return; }
    var O = seaOpts();
    const makeIsland=V4_SEA_BEFORE?buildIsland:v4SeaFriendIsland,makeTag=V4_SEA_BEFORE?buildNameTag:v4SeaTag;
    var renderer, raf = 0, disposed = false;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch (e) {
      setErr("이 기기에서는 3D를 표시할 수 없어요. (WebGL 미지원)");
      return;
    }
    var W = host.clientWidth || 640, H = host.clientHeight || 420;
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;
    renderer.outputEncoding = THREE.sRGBEncoding;
    if(!V4_SEA_BEFORE){renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.88;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, O.dpr));   // 카드 F
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = O.shadow > 0;                                // 카드 D
    renderer.shadowMap.type = THREE.VSMShadowMap;   // 부드러운 가장자리(2026-09-13). addIsleLights의 radius·blurSamples가 세기
    host.appendChild(renderer.domElement);
    SND.loop("bgm");   // 배경음. 음소거면 이름만 기억한다. 3D 화면끼리 옮겨도 같은 <audio>가 이어진다
    host.style.touchAction = "none";

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcfe6ee);
    var aspect = W / H;
    // 섬 화면과 같은 방향(14,12,14)에서 본다. 정사영이라 거리는 상관없고,
    // 안개·그림자 깊이를 넉넉히 잡으려고 멀리 둔다.
    // 화면 아래쪽 바다는 카메라보다 앞에 온다(정사영이라 화면 반높이×1.66만큼).
    // 가장 멀리 물러났을 때(72) 120이므로 그보다 멀리 둔다. 60이면 아래가 잘렸다.
    var CAM_DIST = 160;
    var CAM_OFF = new THREE.Vector3(14, 12, 14).normalize().multiplyScalar(CAM_DIST);
    var VIEW_DIR = CAM_OFF.clone().negate().normalize();
    var tgt = new THREE.Vector3(), goal = new THREE.Vector3();
    var cam = new THREE.OrthographicCamera(-aspect, aspect, 1, -1, 0.1, 600);
    cam.position.copy(CAM_OFF); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
    var d = 12, dGoal = 12;
    function applyCam() {
      cam.left = -d * aspect; cam.right = d * aspect; cam.top = d; cam.bottom = -d;
      cam.updateProjectionMatrix();
      cam.position.copy(tgt).add(CAM_OFF);
      cam.lookAt(tgt);
      cam.updateMatrixWorld();
    }
    var UP = new THREE.Vector3(0, 1, 0);
    var scrF = new THREE.Vector3(-1, 0, -1).normalize();                 // 화면 위쪽
    var scrR = new THREE.Vector3().crossVectors(scrF, UP).normalize();   // 화면 오른쪽

    // 내 섬 — 바다 한가운데. 섬 화면과 같은 함수·같은 시드라 같은 섬이다.
    var mine = V4_SEA_BEFORE?buildIsland(seed):v4SeaOwnIsland(reward,{miniature:true});
    var myHolder = new THREE.Group();
    myHolder.add(mine);
    if(V4_SEA_BEFORE)myHolder.add(buildVegMeshes(vegCached(mine, islandState(entries), { seed: seed })));else myHolder.add(v4SeaLearningPlants(islandState(entries),String(me.id)));
    myHolder.traverse(function (o) { if (o.isInstancedMesh) o.frustumCulled = false; });
    scene.add(myHolder);
    var myTag = O.tags ? makeTag("내 섬", true) : null;
    if (myTag) myHolder.add(myTag);
    // 섬 화면과 같은 반폭. 부두 출항 장면이 끊기지 않고 이어지려면 같아야 한다.
    var D_ISLE = isleCamHalf(cam, mine, aspect);
    // 세로 화면에서는 반높이 대신 가로가 기준이다. 섬 화면 반폭의 2.4배면
    // 가로 화면에서 내 섬과 이웃이 함께 들어온다.
    var D_SEA = Math.max(D_ISLE * 2.4, 10.5 / aspect), D_MIN = D_ISLE * 1.05, D_MAX = 72;

    // 배. 부두에서 떼어 바다에 둔다. 캐릭터는 배에 타고 있다.
    var boat = mine.userData.boat, bdir = mine.userData.boatDir;
    var boatHome = boat.getWorldPosition(new THREE.Vector3());
    var boatHome0 = boatHome.clone(), bdir0 = bdir;   // 내 부두. 돌아올 때 여기로
    scene.attach(boat);
    var ch = V4_SEA_BEFORE?buildCharacter():buildExplorerCharacter();
    if(!V4_SEA_BEFORE)ch.scale.setScalar(.65);
    ch.position.set(0, 0.19, 0);
    if (ch.userData.step) ch.userData.step(0, false, Math.PI / 2);   // 뱃머리(로컬 +x)를 본다
    attachMineMarker(ch);
    boat.add(ch);
    var away0 = arriveRef.current ? 7.0 : 8.8;    // 섬 화면의 출항이 7.0에서 끝난다
    function boatAt(away) {
      boat.position.set(boatHome.x + Math.cos(bdir) * away, boatHome.y, boatHome.z + Math.sin(bdir) * away);
    }
    boatAt(away0);
    boat.rotation.y = -bdir;
    // 출항 이어받기. 섬 화면 마지막 프레임과 같은 카메라(배 이동의 62%)에서 시작해
    // 배가 더 나아가며 카메라가 물러난다 — 화면이 바뀐 것을 배가 이어 말한다.
    var fromFriend = arriveRef.current && arriveRef.current.fromId != null;
    var intro = arriveRef.current && !fromFriend ? { t0: performance.now(), dur: 1700, from: away0, to: 8.8 } : null;
    if (intro || fromFriend) {
      d = dGoal = D_ISLE;
      tgt.set(boatHome.x + Math.cos(bdir) * away0 * 0.62, 0, boatHome.z + Math.sin(bdir) * away0 * 0.62);
    } else {
      d = dGoal = D_SEA;
      tgt.set(boat.position.x, 0, boat.position.z);
    }
    if (fromFriend) boat.visible = false;   // 친구 섬 자리를 알기 전까지
    goal.copy(tgt);
    applyCam();

    // 조명. 섬 화면과 같은 값(addIsleLights). 그림자는 카드 D가 켜져 있으면 안 그린다.
    var key = (V4_SEA_BEFORE?addIsleLights:v4SeaLights)(scene, 20, 300);
    key.shadow.mapSize.set(O.sm, O.sm);
    scene.add(key.target);
    var KEY_OFF = (V4_SEA_BEFORE?new THREE.Vector3(LIGHT.keyDir[0], LIGHT.keyDir[1], LIGHT.keyDir[2]):new THREE.Vector3(-18,32,18)).normalize().multiplyScalar(60);
    function placeLight() {
      key.position.copy(tgt).add(KEY_OFF);
      key.target.position.copy(tgt);
      key.target.updateMatrixWorld();
      var SH = d * 1.7;
      if (key.shadow.camera.right !== SH) {
        key.shadow.camera.left = -SH; key.shadow.camera.right = SH;
        key.shadow.camera.top = SH; key.shadow.camera.bottom = -SH;
        key.shadow.camera.updateProjectionMatrix();
      }
    }
    placeLight();

    // 바다. 학급 온도계 값이 오기 전에는 보통 날(0.5)로 그린다.
    var seaGrp = null;
    function setSea(tone, spots) {
      if (seaGrp) { scene.remove(seaGrp); disposeObj(seaGrp); }
      seaGrp = V4_SEA_BEFORE?buildSeaWide(tone, spots):v4SeaSurface(tone, spots,SEA_UNI.uTime);
      seaRetone(tone);   // 이미 서 있는 섬들의 해안 띠·파도선 색도 새 톤으로
      scene.add(seaGrp);
      if (O.fog) { scene.fog = new THREE.Fog(seaGrp.userData.fogColor, CAM_DIST + 8, CAM_DIST + 40); calibrateFog(); }   // 카드 B
    }
    // 안개 색은 조명을 받은 바다 색과 같아야 한다. 안 맞으면 먼 바다에 띠가 생긴다.
    // 재질 색에 배율을 곱해 맞추려 했더니 반사광 때문에 톤마다 어긋났다.
    // 섬이 없는 바다 한 조각을 4×4로 그려 읽어 오면 정확하다.
    function calibrateFog() {
      if (!scene.fog) return;
      var f = scene.fog, rt = null;
      try {
        rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.FloatType });
        var c2 = cam.clone();
        c2.position.set(-200, 0, -200).add(CAM_OFF); c2.lookAt(-200, 0, -200); c2.updateMatrixWorld();
        scene.fog = null;
        renderer.setRenderTarget(rt);
        renderer.render(scene, c2);
        var px = new Float32Array(4 * 4 * 4);
        renderer.readRenderTargetPixels(rt, 0, 0, 4, 4, px);
        if (isFinite(px[0]) && (px[0] + px[1] + px[2]) > 0) f.color.setRGB(px[0], px[1], px[2]);
      } catch (e) { console.warn("fog calibrate:", e); }
      renderer.setRenderTarget(null);
      scene.fog = f;
      if (rt) rt.dispose();
    }
    function disposeObj(o) { v4SeaDispose(o); }
    setSea(0.5, [{ x: 0, z: 0 }]);

    // 친구 섬. 데이터가 오면 물속에서 떠오른다. 그동안 출항 연출이 진행된다.
    var isles = [], mapR = SEA_R1 + 10, alive = true;
    var reduceMotion = false; try { reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
    var hiRing = new THREE.Mesh(new THREE.RingGeometry(9.0, 10.2, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xfff1b8, transparent: true, opacity: 0, depthWrite: false }));
    hiRing.position.y = 0.05; hiRing.visible = false; hiRing.frustumCulled = false;
    scene.add(hiRing);
    var hi = null;
    function highlight(e) { hi = { e: e, t0: performance.now() }; hiRing.position.set(e.x, 0.05, e.z); hiRing.visible = true; }

    function detailFor(e) {   // 카드 A
      if (!O.lod) return 1;
      return e.ring <= 1 ? 0.75 : e.ring === 2 ? 0.5 : 0.35;
    }
    // 온전한 섬을 세운다(지형 g + 식생 items). grow면 식생이 자라 올라온다(점진 생성이 원판을 바꿀 때)
    function finishFull(e, g, items, det, grow) {
      if (e.full) { e.holder.remove(e.full); disposeObj(e.full); e.full = null; }
      var h = new THREE.Group();
      h.add(g);
      var veg = g.userData.v4NewIsland ? v4SeaLearningPlants(e.state,e.seed) : buildVegMeshes(items);
      h.add(veg);
      // 인스턴스 메시의 경계 구는 인스턴스 하나 크기라, 섬 중심이 화면을 벗어나는
      // 순간 식생이 통째로 사라진다. 컬링은 아래 cull()이 섬 단위로 한다.
      h.traverse(function (o) { if (o.isInstancedMesh) o.frustumCulled = false; });
      if (grow && !reduceMotion) { veg.scale.setScalar(0.001); h.userData.grow = { veg: veg, t0: performance.now() }; }
      e.full = h; e.det = det; e.isle = g; e.job = null;
      e.holder.add(h);
    }
    // 한 번에 다 만든다 — 항해 목적지·친구 섬에서 돌아온 자리처럼 지금 당장 온전해야 할 때. 진행 중이던 조각 작업은 버린다
    function ensureFull(e, det) {
      if (e.full && e.det >= det) return;
      var g = makeIsland(e.seed, { detail: det, tone: seaGrp ? seaGrp.userData.tone : 0.5 });
      finishFull(e, g, g.userData.v4NewIsland ? [] : vegCached(g, e.state, { seed: e.seed }), det, false);   // 캐시(2026-09-15): 두 번째 진입은 배치를 건너뛴다
    }
    // 조각 생성(2026-09-15). 큐 맨 앞(가장 가까운) 섬을 예산이 남는 동안만 진행한다: ① 지형 buildIsland(1~24ms, 한 덩이) ② 식생 — 캐시에 있으면 바로,
    // 없으면 제너레이터를 예산까지 돌리고 다음 프레임에 이어서 ③ 세우기(원판을 치우고 식생이 자란다). 캐시 결과와 동기 생성 결과는 같은 배열이다
    function buildStep(deadline) {
      while (buildQ.length && performance.now() < deadline) {
        var e = buildQ[0], det = detailFor(e);
        if (e.full && e.det >= det) { buildQ.shift(); showFull(e); continue; }   // 그새 동기로 만들어졌다(항해 목적지)
        var job = e.job;
        if (!job || job.det !== det) job = e.job = { det: det, g: null, gen: null, key: null };
        if (!job.g) { job.g = makeIsland(e.seed, { detail: det, tone: seaGrp ? seaGrp.userData.tone : 0.5 }); job.key = job.g.userData.v4NewIsland ? null : vegKey(job.g, e.state, { seed: e.seed }); continue; }
        var items = job.g.userData.v4NewIsland ? [] : vegGet(job.key);
        if (!items) {
          if (!job.gen) job.gen = buildVegetationGen(job.g, e.state, { seed: e.seed });
          var r = job.gen.next();
          while (!r.done && performance.now() < deadline) r = job.gen.next();
          if (!r.done) return;   // 다음 프레임에 이어서
          items = vegPut(job.key, r.value);
        }
        finishFull(e, job.g, vegCopy(items), det, e.proxy && e.proxy.visible);
        buildQ.shift(); showFull(e);
      }
    }
    function showFull(e) {
      ensureFull(e, detailFor(e));
      e.full.visible = true;
      if (e.proxy) e.proxy.visible = false;
    }
    function showProxy(e) {
      if (!e.proxy) { e.proxy = buildIsleProxy(e.seed); e.holder.add(e.proxy); }
      e.proxy.visible = true;
      if (e.full) e.full.visible = false;
    }
    // 카드 C. 카메라 목표에서 가까운 N개만 온전히. 섬은 프레임당 하나씩 만들어
    // 한꺼번에 30개를 만들 때 화면이 멎는 것을 피한다. 만들기 전에는 원판이 선다.
    var buildQ = [], nearAt = new THREE.Vector3(1e9, 0, 1e9);
    function refreshNear(force) {
      if (!isles.length) return;
      if (!force && goal.distanceTo(nearAt) < 6) return;
      nearAt.copy(goal);
      var order = isles.slice().sort(function (a, b) {
        return Math.hypot(a.x - goal.x, a.z - goal.z) - Math.hypot(b.x - goal.x, b.z - goal.z);
      });
      buildQ = [];
      order.forEach(function (e, i) {
        var full = O.near <= 0 || i < O.near || e.keep;
        if (!full) { showProxy(e); return; }
        if (e.full && e.det >= detailFor(e)) showFull(e);
        else { if (!e.full) showProxy(e); buildQ.push(e); }   // 낮은 디테일로 이미 서 있으면 그대로 둔 채 올린다 — 조각 생성 중 원판으로 되돌아가지 않게(2026-09-15)
      });
    }
    (async function () {
      var code = me.schoolCode, list = [], tone = { tone: 0.5, n: 0 };
      try {
        var r = await Promise.all([sGet(stuKey(code)), dayTone(code)]);
        list = Array.isArray(r[0]) ? r[0] : Object.keys(r[0] || {}).map(function (k) { return r[0][k]; });
        tone = r[1] || tone;
      } catch (e) { console.error("sea:", e); }
      if (!alive) return;
      var others = list.filter(function (s) { return s && s.id != null && String(s.id) !== String(me.id); })
                       .map(function (s) { return { id: s.id, name: s.name || "" }; });
      var lay = seaLayout(others);
      mapR = lay.mapR;
      var sums = await Promise.all(lay.map(function (p) {
        return isleLoad(p.stu.id).catch(function () { return { name: "", state: [] }; });
      }));
      if (!alive) return;
      var now = performance.now();
      lay.forEach(function (p, i) {
        var e = { id: p.stu.id, name: p.stu.name || sums[i].name || "친구", seed: String(p.stu.id || p.stu.name),
                  x: p.x, z: p.z, ring: p.ring, state: sums[i].state || [],
                  holder: new THREE.Group(), full: null, proxy: null, tag: null, det: 0,
                  born: now + i * 45 };
        e.holder.position.set(e.x, -3.5, e.z);
        scene.add(e.holder);
        if (O.tags) { e.tag = makeTag(e.name); e.holder.add(e.tag); }   // 카드 E
        isles.push(e);
      });
      setSea(tone.tone, [{ x: 0, z: 0 }].concat(lay));
      setNames(isles.map(function (e) { return { id: e.id, name: e.name }; })
                    .sort(function (a, b) { return a.name.localeCompare(b.name, "ko"); }));
      setLoading("");
      refreshNear(true);
      if(!fromFriend&&!intro)overview(true);
      // 친구 섬에서 나온 배. 그 섬 부두에서 출항을 이어받는다.
      if (fromFriend) {
        var fe = findIsle(arriveRef.current.fromId);
        if (fe) {
          ensureFull(fe, 1); showFull(fe); fe.keep = true;
          var fb = fe.isle.userData.boat;
          boatHome = new THREE.Vector3(fe.x + fb.position.x, fb.position.y, fe.z + fb.position.z);
          bdir = fe.isle.userData.boatDir;
          boat.rotation.y = -bdir;
          fe.holder.position.y = 0;
        }
        boat.visible = true;
        boatAt(7.0);
        tgt.set(boatHome.x + Math.cos(bdir) * 7.0 * 0.62, 0, boatHome.z + Math.sin(bdir) * 7.0 * 0.62);
        goal.copy(tgt); applyCam();
        if (arriveRef.current.autoHome) sailHome();
        else intro = { t0: performance.now(), dur: 1700, from: 7.0, to: 8.8 };
      }
      // 오늘의 섬 — 최근 7일 받은 공감이 적은 친구에게 기울여 뽑는다(가중 추첨).
      // 아이는 개수를 못 보고, 아이마다 다른 섬이 뜨므로 "추천된 아이 = 못 받는 아이"로 읽히지 않는다.
      // 하루 동안 같은 섬이 뜨도록 시드는 (나, 오늘)이다.
      if (isles.length) {
        empCounts(isles.map(function (e) { return e.id; }), 7).then(function (c) {
          if (!alive) return;
          var rnd = mulberry32(hashSeed("today:" + me.id + ":" + dayStamp())), tot = 0, ws = [];
          isles.forEach(function (e) { var w = 1 / (1 + (c.recv[String(e.id)] || 0)); ws.push(w); tot += w; });
          var pick = rnd() * tot, acc = 0, chosen = isles[0];
          for (var i = 0; i < isles.length; i++) { acc += ws[i]; if (pick <= acc) { chosen = isles[i]; break; } }
          setTodayIsle({ id: chosen.id, name: chosen.name });
        }).catch(function () {});
      }
    })();
    var overviewActive=true;
    function overview(immediate=false){
      if(sail)return;follow=false;overviewActive=true;setSel(null);hi=null;hiRing.visible=false;
      const elevation=CAM_OFF.y/CAM_DIST,all=[{x:0,z:0},...isles];
      let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity;
      all.forEach(e=>{const x=e.x*scrR.x+e.z*scrR.z,y=(e.x*scrF.x+e.z*scrF.z)*elevation;xmin=Math.min(xmin,x-10);xmax=Math.max(xmax,x+10);ymin=Math.min(ymin,y-7);ymax=Math.max(ymax,y+10);});
      const height=host.clientHeight||H,width=host.clientWidth||W,top=width<600?180:140,bottom=100;
      dGoal=Math.max((xmax-xmin)/(2*aspect*.88),(ymax-ymin)/(2*Math.max(.35,1-(top+bottom)/height)));
      D_MAX=Math.max(72,dGoal*1.4);D_MIN=Math.min(8,7/aspect);
      const x=(xmin+xmax)/2,y=(ymin+ymax)/2+(top-bottom)/height*dGoal;
      goal.copy(scrR).multiplyScalar(x).addScaledVector(scrF,y/elevation);
      if(immediate){tgt.copy(goal);d=dGoal;applyCam();}
    }
    function findIsle(id) {
      for (var i = 0; i < isles.length; i++) if (String(isles[i].id) === String(id)) return isles[i];
      return null;
    }

    // 튜토리얼 앵커(2026-09-15): 오늘의 섬을 감싸는 상자(반폭 7·높이 3, 탭 반경 9.5와 같은 급) 여덟 귀를 투영해 화면 bbox를 앵커 div에 쓴다. 같으면 style을 안 건드린다
    var anchV = new THREE.Vector3(), anchPts = [];
    for (var ai = 0; ai < 8; ai++) anchPts.push(new THREE.Vector3());
    function placeSeaAnchor() {
      var el = seaAnchorRef.current, ti = todayRef.current;
      if (!el || !ti) return;
      var e = findIsle(ti.id); if (!e) return;
      var w = renderer.domElement.clientWidth, hh = renderer.domElement.clientHeight, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, n = 0;
      for (var dx = -1; dx <= 1; dx += 2) for (var dz = -1; dz <= 1; dz += 2) for (var dy = 0; dy <= 1; dy++) {
        anchV.set(e.x + dx * 7, e.holder.position.y + dy * 3, e.z + dz * 7).project(cam);
        var sx = (anchV.x + 1) / 2 * w, sy = (1 - anchV.y) / 2 * hh;
        if (sx < x0) x0 = sx; if (sx > x1) x1 = sx; if (sy < y0) y0 = sy; if (sy > y1) y1 = sy;
      }
      var k = Math.round(x0) + "," + Math.round(y0) + "," + Math.round(x1 - x0) + "," + Math.round(y1 - y0);
      if (el.__k === k) return;
      el.__k = k;
      el.style.left = Math.round(x0) + "px"; el.style.top = Math.round(y0) + "px"; el.style.width = Math.round(x1 - x0) + "px"; el.style.height = Math.round(y1 - y0) + "px";
    }
    // 항해. 탭한 섬의 부두 앞까지. 섬을 뚫지 않게 돌아가고, 3초 안에 닿는다.
    var sail = null;
    function sailTo(e) {
      if (!e || sail || intro) return;
      SND.play("woosh");   // 친구 섬으로 떠난다 — 섬 화면의 전환음과 같은 소리
      var to, th;
      if (e.home) {
        // 내 부두로. 섬 화면의 도착 연출이 여기서 이어받는다
        to = new THREE.Vector3(boatHome0.x, 0, boatHome0.z); th = bdir0;
      } else {
        e.keep = true;                     // 도착할 섬은 카드 C와 무관하게 온전히
        ensureFull(e, 1); showFull(e);
        var g = e.isle; th = g.userData.dockTh;
        var bl = g.userData.boat.position;   // 그 섬 부두에 댄다
        to = new THREE.Vector3(e.x + bl.x, 0, e.z + bl.z);
      }
      var from = new THREE.Vector3(boat.position.x, 0, boat.position.z);
      var obs = e.home ? [] : [new THREE.Vector3(0, 0, 0)];
      isles.forEach(function (o) { if (o !== e) obs.push(new THREE.Vector3(o.x, 0, o.z)); });
      var pts = seaPath(from, to, obs);
      var curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
      var len = curve.getLength();
      sail = { e: e, curve: curve, t0: performance.now(),
               dur: Math.max(1400, Math.min(3000, len / 22 * 1000)),
               head0: boat.rotation.y, headEnd: -th };
      setSel(null);
      setSailing({ label: e.home ? "내 섬으로 돌아가는 중…" : e.name+" 만나러 가는 중…" });
      if (hi) { hi = null; hiRing.visible = false; }
    }
    function sailHome() { sailTo({ home: true, x: 0, z: 0, name: "내 섬", isle: mine }); }
    // 배가 이미 내 부두 옆이면 바로, 멀면 배로 돌아간다(3초 안).
    api.current.homeSail = function () {
      if (sail || intro) return;
      if (Math.hypot(boat.position.x - boatHome0.x, boat.position.z - boatHome0.z) < 3) { onBack(null); return; }
      sailHome();
    };
    function angLerp(a, b, t) {
      var dlt = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      return a + dlt * t;
    }
    // 화면 쪽 조작 창구
    // 섬 하나를 고른다(2026-09-15 저녁): 카메라가 그 섬으로 가고 링이 켜지고 카드("배 타고 가기")가 뜬다. 항해는 카드에서 한 번 더 눌러야 한다 — 탭·오늘의 섬·이름 찾기 전부 이 길
    function focusIsle(e) {
      if (!e || sail) return;
      goal.set(e.x, 0, e.z); follow = false;overviewActive=false;dGoal=Math.max(12,10/aspect);
      highlight(e);
      setSel({ id: e.id, name: e.name, home: !!e.home });
    }
    api.current.focus = function (id) { focusIsle(findIsle(id)); };
    api.current.sail = function (id) { sailTo(findIsle(id)); };
    api.current.home = function () { if (sail) return; goal.set(0, 0, 0); follow = false; };
    api.current.zoom = function (v) { overviewActive=false;dGoal=clampD(dGoal*v); };
    api.current.overview=()=>overview();
    api.current.clear=()=>{setSel(null);hi=null;hiRing.visible=false;};
    api.current.capture=()=>{renderer.render(scene,cam);return renderer.domElement.toDataURL('image/png');};
    api.current.metrics=()=>({viewport:[host.clientWidth,host.clientHeight],canvas:[renderer.domElement.width,renderer.domElement.height],camera:{half:d,target:[tgt.x,tgt.z]},calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,islands:isles.length+1,full:isles.filter(e=>e.full).length,reduced:reduceMotion,assets:V4Assets.stats});
    const wake=v4SeaWake();scene.add(wake);
    if (devMode()) api.current.isleIds = function () { return isles.map(function (e) { return String(e.id); }); };   // #dev(2026-09-16) 하네스 확인용
    if (devMode()) api.current.screenOf = function (id) {   // #dev(2026-09-16): 그 섬의 화면 좌표 — 하네스가 더블클릭을 흉내 낼 때
      var e = findIsle(id); if (!e) return null; var v = new THREE.Vector3(e.x, 0, e.z).project(cam), rc = renderer.domElement.getBoundingClientRect();
      return [rc.left + (v.x + 1) / 2 * rc.width, rc.top + (1 - v.y) / 2 * rc.height]; };
    if (devMode()) window.__sea = api.current;   // #dev: 콘솔·하네스에서 조작

    // 포인터: 끌면 둘러보고, 탭하면 그 섬으로 간다. 두 손가락은 확대·축소.
    var follow = false, pts = {}, drag = null, pinch = null, lastTap = null;   // lastTap: 더블클릭 판정(2026-09-16) { id, t }
    var SEA_DBL_MS = 400;   // 같은 섬을 이 안에 두 번 누르면 카드 없이 바로 출발
    var ray = new THREE.Raycaster(), plane = new THREE.Plane(UP, 0), hitP = new THREE.Vector3();
    function toWorld(px, py) {
      var rc = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera({ x: ((px - rc.left) / rc.width) * 2 - 1, y: -((py - rc.top) / rc.height) * 2 + 1 }, cam);
      return ray.ray.intersectPlane(plane, hitP) ? hitP : null;
    }
    function clampD(v) { return Math.max(D_MIN, Math.min(D_MAX, v)); }
    function onDown(ev) {
      if (ev.button != null && ev.button !== 0) return;
      pts[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      var ids = Object.keys(pts);
      if (ids.length === 2) {
        var a = pts[ids[0]], b = pts[ids[1]];
        pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), dg: dGoal };
        drag = null;
      } else {
        drag = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, lx: ev.clientX, ly: ev.clientY, moved: false };
      }
      try { host.setPointerCapture(ev.pointerId); } catch (e) {}
    }
    function onMove(ev) {
      if (!pts[ev.pointerId]) return;
      pts[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      if (pinch) {
        var ids = Object.keys(pts);
        if (ids.length >= 2) {
          var a = pts[ids[0]], b = pts[ids[1]], dd = Math.hypot(a.x - b.x, a.y - b.y);
          if (dd > 1) {overviewActive=false;dGoal = clampD(pinch.dg * pinch.d0 / dd);}
        }
        return;
      }
      if (!drag || drag.id !== ev.pointerId || sail || intro) return;
      var dx = ev.clientX - drag.lx, dy = ev.clientY - drag.ly;
      drag.lx = ev.clientX; drag.ly = ev.clientY;
      if (!drag.moved && Math.hypot(ev.clientX - drag.x0, ev.clientY - drag.y0) > 7) drag.moved = true;
      if (!drag.moved) return;
      overviewActive=false;
      var k = 2 * d / (host.clientHeight || H);
      goal.addScaledVector(scrR, -dx * k).addScaledVector(scrF, dy * k);
      var gl = Math.hypot(goal.x, goal.z);
      if (gl > mapR) { goal.x *= mapR / gl; goal.z *= mapR / gl; }
      tgt.copy(goal);          // 끌 때는 바로 따라와야 손에 붙는다
      follow = false;
    }
    function onUp(ev) {
      delete pts[ev.pointerId];
      if (pinch) { if (!Object.keys(pts).length) pinch = null; drag = null; return; }
      if (!drag || drag.id !== ev.pointerId) return;
      var tap = !drag.moved; drag = null;
      if (!tap || sail || intro) return;
      var p = toWorld(ev.clientX, ev.clientY);
      if (!p) return;
      var best = null, bd = 1e9;
      isles.forEach(function (e) {
        var dd = Math.hypot(e.x - p.x, e.z - p.z);
        if (dd < 9.5 && dd < bd) { best = e; bd = dd; }
      });
      if (best) {
        // DESIGN.md §7 — 친구 섬을 탭하면 배가 항해한다 → 2026-09-15 저녁부터는 탭하면 카메라가 가고 카드가 뜬다. 잘못 눌러도 안 떠난다. 항해는 카드의 [배 타고 가기]
        // 2026-09-16: 같은 섬을 SEA_DBL_MS 안에 두 번 누르면(더블클릭·더블탭) 카드 없이 바로 출발. 한 번은 전처럼 카드
        var tNow = performance.now();
        if (lastTap && lastTap.id === best.id && tNow - lastTap.t < SEA_DBL_MS) {
          lastTap = null;
          if (best.home) { if (api.current.homeSail) api.current.homeSail(); } else sailTo(best);
        } else { lastTap = { id: best.id, t: tNow }; focusIsle(best); }
      } else if (Math.hypot(p.x, p.z) < 9.5) {
        goal.set(0, 0, 0); follow = false; setSel(null);
      }
    }
    function onWheel(ev) {
      ev.preventDefault();
      overviewActive=false;
      dGoal = clampD(dGoal * Math.exp(ev.deltaY * 0.0012));
    }
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onUp);
    host.addEventListener("wheel", onWheel, { passive: false });

    // 섬 단위 컬링. 화면 밖과 안개 너머는 그리지 않는다.
    var vv = new THREE.Vector3();
    function cull() {
      var mx = 1 + 11 / (d * aspect), my = 1 + 12 / d;
      var far = scene.fog ? scene.fog.far + 9 : 1e9;
      for (var i = 0; i < isles.length; i++) {
        var e = isles[i];
        vv.set(e.x, 0, e.z);
        var depth = vv.clone().sub(cam.position).dot(VIEW_DIR);
        vv.project(cam);
        var vis = Math.abs(vv.x) < mx && Math.abs(vv.y) < my && depth < far;
        if (e.holder.visible !== vis) e.holder.visible = vis;
      }
    }
    var frames = 0, last = performance.now(), lastT = last;
    function tick() {
      if (disposed) return;
      raf = requestAnimationFrame(tick);
      var t0 = performance.now(), dt = Math.min(0.05, (t0 - lastT) / 1000);
      lastT = t0;
      SEA_UNI.uTime.value = reduceMotion?0:t0 / 1000;
      if (intro) {
        var u = Math.min(1, (t0 - intro.t0) / intro.dur), eo = 1 - (1 - u) * (1 - u);
        boatAt(intro.from + (intro.to - intro.from) * eo);
        dGoal = D_ISLE + (D_SEA - D_ISLE) * eo;
        goal.set(boat.position.x, 0, boat.position.z);
        if (u >= 1) { intro = null; refreshNear(true); }
      } else if (sail) {
        var su = Math.min(1, (t0 - sail.t0) / sail.dur), se = su * su * (3 - 2 * su);
        var p = sail.curve.getPointAt(se), tn = sail.curve.getTangentAt(se);
        boat.position.set(p.x, boatHome.y + (reduceMotion?0:Math.sin(t0 / 380) * 0.025), p.z);
        var head = -Math.atan2(tn.z, tn.x);
        // 마지막에는 부두 쪽으로 뱃머리를 돌려 댄다
        var dock = Math.max(0, (su - 0.85) / 0.15);
        boat.rotation.y = angLerp(head, sail.headEnd, dock);
        boat.rotation.z = (reduceMotion?0:Math.sin(t0 / 520) * 0.02);
        goal.set(boat.position.x, 0, boat.position.z);
        if (su >= 1) {
          var e = sail.e; sail = null;
          setSailing(null);
          if (e.home) {
            // 내 섬 화면이 배로 도착하는 연출을 이어받는다
            setCover(true);
            window.setTimeout(function () { if (!disposed) onBack({ boatDir: bdir0 }); }, 480);
          } else if (onGo) {
            // 친구 섬 화면이 이어받는다. 덮개가 옆에서 들어온다(수평으로 건너간다 §3)
            setCover(true);
            var info = { id: e.id, name: e.name, state: e.state, boatDir: e.isle.userData.boatDir };
            window.setTimeout(function () { if (!disposed) onGo("friend", info); }, 480);
          } else {
            goal.set(e.x, 0, e.z); dGoal = D_ISLE * 1.25;   // 도착한 섬을 화면에 담는다(onGo가 없을 때뿐 — App은 항상 준다)
            follow = false;
            refreshNear(true);
          }
        }
      } else {
        boat.position.y = boatHome.y + (reduceMotion?0:Math.sin(t0 / 380) * 0.025);
        boat.rotation.z = (reduceMotion?0:Math.sin(t0 / 520) * 0.02);
        if (follow) goal.set(boat.position.x, 0, boat.position.z);
      }
      if (ch.userData.markerTick) ch.userData.markerTick(reduceMotion?0:t0 / 1000, cam);
      wake.visible=!!sail&&!reduceMotion&&!V4_SEA_BEFORE;wake.position.set(boat.position.x,.03,boat.position.z);wake.rotation.y=boat.rotation.y;
      // 카메라는 목표를 부드럽게 따라간다
      var kf = 1 - Math.exp(-dt * 6);
      tgt.lerp(goal, kf);
      d += (dGoal - d) * kf;
      applyCam();
      if (O.shadow) placeLight();
      if (scene.fog) { scene.fog.near = CAM_DIST + d * 0.5; scene.fog.far = CAM_DIST + d * 2.2; }
      // 친구 섬이 물속에서 떠오른다
      // 이름표는 화면 크기가 대충 일정하게 — 가까이 가면 줄고 멀어지면 커진다.
      // 1로 고정해 두면 도착 화면에서 판이 섬을 가로지른다.
      var tagS = V4_SEA_BEFORE?Math.max(0.45, Math.min(2.6, d / D_SEA)):Math.max(.65,Math.min(4,d/19));
      if (myTag) { myTag.scale.setScalar(tagS); myTag.material.opacity = 1; }
      for (var i = 0; i < isles.length; i++) {
        var e2 = isles[i];
        if (e2.holder.position.y < 0) {
          var bu = reduceMotion?1:Math.max(0, Math.min(1, (t0 - e2.born) / 700));
          e2.holder.position.y = -3.5 * (1 - bu * bu * (3 - 2 * bu));
          if (bu >= 1) e2.holder.position.y = 0;
        }
        if (e2.tag) {
          e2.tag.scale.setScalar(tagS);
          var dist = Math.hypot(e2.x - tgt.x, e2.z - tgt.z);
          e2.tag.material.opacity = Math.max(0.3, Math.min(1, 1.2 - dist / (d * 2.4)));
        }
      }
      if (hi) {hiRing.scale.setScalar(reduceMotion?1:1+.025*Math.sin(t0/650));hiRing.material.opacity=reduceMotion?.55:.52+.10*Math.sin(t0/800);}
      buildStep(t0 + SEA_BUILD_MS);   // 진입 중 섬 생성 — 프레임 예산 안에서만(2026-09-15)
      for (var gi = 0; gi < isles.length; gi++) {   // 식생 자라나기
        var gr = isles[gi].full && isles[gi].full.userData.grow;
        if (!gr) continue;
        var gu = Math.min(1, (t0 - gr.t0) / SEA_GROW_MS), ge = 1 - Math.pow(1 - gu, 3);
        gr.veg.scale.setScalar(Math.max(0.001, ge));
        if (gu >= 1) { gr.veg.scale.setScalar(1); delete isles[gi].full.userData.grow; }
      }
      if (!intro && !sail) refreshNear(false);
      cull();
      renderer.render(scene, cam);
      if (tutOnRef.current) placeSeaAnchor();   // 투어 중에만, 렌더 뒤(카메라가 이 프레임 자리)
      frames++;
      var now = performance.now();
      if (now - last >= 500) {
        setFps(Math.round(frames * 1000 / (now - last)));
        seaFxNote(Math.round(frames * 1000 / (now - last)));
        var ri = renderer.info.render;
        setStats({ calls: ri.calls, tris: ri.triangles });
        host.dataset.v4SeaMetrics=JSON.stringify(api.current.metrics());
        frames = 0; last = now;
      }
    }
    tick();

    function onResize() {
      if (disposed || !host) return;
      var w = host.clientWidth || 640, h = host.clientHeight || 420;
      if (!w || !h) return;
      aspect = w / h;
      renderer.setSize(w, h);
      if(overviewActive)overview(true);
      applyCam();
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    var ro = null;
    if (typeof ResizeObserver !== "undefined") { ro = new ResizeObserver(onResize); ro.observe(host); }
    return function () {
      disposed = true; alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      if (ro) ro.disconnect();
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      host.removeEventListener("wheel", onWheel);
      disposeObj(scene);
      SND.leave();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [seed]);
  var matches = q.trim() ? names.filter(function (n) { return n.name.indexOf(q.trim()) >= 0; }).slice(0, 8) : [];
  function pick(n) { setQ(""); setListOpen(false); if (api.current.focus) api.current.focus(n.id); }
  if(!V4_SEA_BEFORE)return v4h('main',{className:'v4-sea','aria-label':'우리 반 바다'},
    v4h('div',{ref:hostRef,className:'v4-sea-canvas'}),
    todayIsle&&v4h('div',{'data-tut':'sea-isle',ref:seaAnchorRef,style:{position:'absolute',visibility:'hidden',pointerEvents:'none'}}),
    v4h('header',{className:'v4-sea-header'},v4h('div',{className:'v4-sea-title'},v4h('h1',null,v4h('img',{src:new URL('sea-title.svg',V4_UI_ASSETS).href,alt:'마음 바다 탐험대  우리 반 바다'})),v4h('p',null,'친구를 골라 만나러 가요.')),v4h('button',{className:'v4-sea-home',disabled:!!sailing,onClick:()=>api.current.homeSail?api.current.homeSail():onBack(null)},'⌂ 내 섬으로')),
    v4h('section',{className:'v4-sea-finder','aria-label':'친구 섬 찾기'},v4h('div',{className:'v4-sea-search'},v4h('input',{'aria-label':'친구 이름으로 찾기',value:q,placeholder:'친구 이름으로 찾기',onChange:e=>{setQ(e.target.value);setListOpen(false);},onKeyDown:e=>{if(e.key==='Enter'&&matches.length)pick(matches[0]);if(e.key==='Escape')setQ('');}}),v4h('button',{'aria-expanded':listOpen,onClick:()=>{setListOpen(!listOpen);setQ('');}},'친구 목록')),
      (listOpen||q.trim())&&v4h('div',{className:'v4-sea-results'},(listOpen?names:matches).length?(listOpen?names:matches).map(n=>v4h('button',{key:n.id,onClick:()=>pick(n)},v4h('span',null,'⚑'),n.name,v4h('span',null,'→'))):v4h('p',null,loading||(q?'이름을 다시 확인해 주세요.':'아직 친구 섬이 없어요.'))),
      todayIsle&&!q&&!listOpen&&!sel&&!sailing&&v4h('button',{className:'v4-sea-today','data-tut':'sea-today',onClick:()=>pick(todayIsle)},'✧ 오늘은 '+todayIsle.name+' 만나러 가 볼까요?')),
    v4h('nav',{className:'v4-sea-tools','aria-label':'바다 화면 조작'},v4h('button',{className:'v4-sea-text-button','aria-label':'홈으로',onClick:onHome},'홈'),v4h('button',{className:'v4-sea-text-button',onClick:()=>api.current.overview?.()},'전체 보기'),v4h('button',{'aria-label':'바다 축소',onClick:()=>api.current.zoom?.(1.22)},v4ToolIcon('minus')),v4h('button',{'aria-label':'바다 확대',onClick:()=>api.current.zoom?.(.82)},v4ToolIcon('plus')),onTour&&v4h('button',{'aria-label':'바다 둘러보기',onClick:()=>onTour(()=>{try{localStorage.setItem('tutSea','1');}catch{}setTutSeen(true);})},'?'),v4h(V4SoundButton)),
    !sel&&!sailing&&v4h('p',{className:'v4-sea-hint','data-tut':'sea-hint'},'섬을 눌러 가까이 살펴보세요',v4h('small',null,'끌어서 둘러보기  두 번 누르면 바로 출항')),
    sel&&!sailing&&v4h('section',{className:'v4-sea-destination','aria-label':'선택한 섬'},v4h('div',null,v4h('small',null,'이번에 가 볼 곳'),v4h('h2',null,sel.home?'내 마음섬':sel.name)),v4h('button',{className:'v4-sea-sail',onClick:()=>sel.home?api.current.homeSail?.():api.current.sail?.(sel.id)},'배 타고 가기 →'),v4h('button',{'aria-label':'섬 선택 닫기',onClick:()=>api.current.clear?.()},'×')),
    (loading||sailing||err)&&v4h('p',{className:'v4-sea-status',role:err?'alert':'status'},err||loading||sailing.label),
    (reveal||cover)&&v4h('div',{className:'v4-sea-transition '+(cover?'cover':'reveal')}),
    V4_QUERY.get('inspect')==='1'&&v4h(V4SeaInspect,{api,fps,stats}));
  var panel = { background: "rgba(255,255,255,0.94)", borderRadius: 12, boxShadow: "0 3px 14px rgba(0,0,0,0.16)" };
  return React.createElement("div", { style: { position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#dfeef2" } },
    V4_QUERY.get("inspect")==="1"&&v4h(V4SeaInspect,{api,fps,stats}),
    React.createElement("div", { ref: hostRef, style: { position: "absolute", inset: 0 } }),
    // 튜토리얼 앵커(오늘의 섬이 정해졌을 때만 존재, 자리는 투어 중 렌더 루프가). 보이지 않고 클릭도 받지 않는다
    todayIsle ? React.createElement("div", { "data-tut": "sea-isle", ref: seaAnchorRef, style: { position: "absolute", left: 0, top: 0, width: 0, height: 0, pointerEvents: "none", visibility: "hidden" } }) : null,
    React.createElement("style", null, "@keyframes seaReveal{from{clip-path:inset(0 0 0 0)}to{clip-path:inset(0 100% 0 0)}}"),
    reveal ? React.createElement("div", {
      style: { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5,
               background: "linear-gradient(90deg, rgba(99,195,204,0.8), rgba(59,163,187,0.99))",
               animation: "seaReveal 720ms cubic-bezier(0.2,0.4,0.4,1) 0ms forwards" } }) : null,
    err ? React.createElement("div", {
      style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 20, color: "#475569", fontSize: 14, lineHeight: 1.8 }
    }, err) : null,
    // 측정용 HUD. 카드 상태를 함께 보여 크롬북에서 무엇을 켜고 껐는지 바로 안다. #dev에서만(2026-09-15, 배포본에서는 안 보인다)
    devMode() ? React.createElement("div", { className: "tut-dim",
      style: { position: "absolute", left: 10, top: 10, padding: "3px 9px", borderRadius: 8, background: "rgba(255,255,255,0.82)",
               fontSize: 12, color: fps && fps < 30 ? "#dc2626" : "#4a72a0", fontVariantNumeric: "tabular-nums", lineHeight: 1.5 }
    }, fps, " fps", stats ? React.createElement("span", { style: { color: "#94a3b8" } },
        "    " + stats.calls + " calls    " + (stats.tris / 1000).toFixed(0) + "k tri") : null,
      React.createElement("div", { style: { fontSize: 11, color: "#7a8f9a", fontFamily: "ui-monospace, Menlo, monospace" } }, seaCardText(cards) + "  " + seaFxText())) : null,
    React.createElement("style", null, "@keyframes seaCover{from{clip-path:inset(0 0 0 100%)}to{clip-path:inset(0 0 0 0)}}"),
    cover ? React.createElement("div", {
      style: { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 6,
               background: "linear-gradient(90deg, rgba(99,195,204,0.8), rgba(59,163,187,0.99))",
               animation: "seaCover 460ms cubic-bezier(0.55,0,0.85,0.6) 0ms forwards" } }) : null,
    React.createElement("button", { className: "tut-dim",
      onClick: function () { if (api.current.homeSail) api.current.homeSail(); else onBack(null); },
      style: { position: "absolute", right: 10, top: 10, ...bBack }   // 돌아가는 길(2026-09-15 저녁, bBack)
    }, "🏝 내 섬으로"),
    React.createElement(SndBtn, { small: small, className: "tut-dim", top: 52 }),
    // 튜토리얼 시작 팻말(2026-09-15). 내 섬의 것과 같은 모양 — 처음이면 크게(빛 스침), 한 번 본 뒤(localStorage tutSea)엔 물음표만. #dev에서는 HUD 아래
    onTour ? React.createElement("button", {
      className: (tutSeen ? "isle-tour-btn seen" : "isle-tour-btn") + " tut-dim",
      "aria-label": "바다 둘러보기", title: tutSeen ? "바다 둘러보기" : undefined,
      onClick: function () { onTour(function () { try { localStorage.setItem("tutSea", "1"); } catch (e) {} setTutSeen(true); }); },
      style: { ...WOOD_TAG, position: "absolute", left: 10, top: devMode() ? 62 : 10, zIndex: 5, cursor: "pointer", fontFamily: HOME_FONT.body,
               padding: tutSeen ? "2px 9px" : "5px 12px", fontSize: tutSeen ? 14 : 13, overflow: "hidden" }
    }, tutSeen ? "?" : "처음 오셨나요? 바다 둘러보기",
       tutSeen ? null : React.createElement("span", { className: "sign-shine", "aria-hidden": true })) : null,
    // 친구 찾기 — 검색과 명단 둘 다.
    React.createElement("div", { className: "tut-dim",
      style: { position: "absolute", left: "50%", top: small ? 66 : 52, transform: "translateX(-50%)", width: small ? "min(92vw, 340px)" : 360, zIndex: 4 }
    },
      React.createElement("div", { style: { display: "flex", gap: 6 } },
        React.createElement("input", {
          value: q, placeholder: "친구 이름으로 찾기",
          onChange: function (ev) { setQ(ev.target.value); setListOpen(false); },
          onKeyDown: function (ev) { if (ev.key === "Enter" && matches.length) pick(matches[0]); if (ev.key === "Escape") setQ(""); },
          style: { flex: 1, minWidth: 0, padding: "8px 12px", borderRadius: 12, border: "1px solid #cfdde3",
                   background: "rgba(255,255,255,0.94)", fontSize: 14, fontFamily: "inherit", outline: "none" }
        }),
        React.createElement("button", {
          onClick: function () { setListOpen(function (v) { return !v; }); setQ(""); },
          style: { ...bSoft, padding: "8px 12px", fontSize: 13, color: "#0e7490", border: "1px solid #99d8c9",
                   background: listOpen ? "#e0f4f1" : "rgba(255,255,255,0.94)", whiteSpace: "nowrap" }
        }, "명단 " + (names.length || ""))),
      matches.length ? React.createElement("div", { style: { ...panel, marginTop: 6, overflow: "hidden" } },
        matches.map(function (n) {
          return React.createElement("button", {
            key: String(n.id), onClick: function () { pick(n); },
            style: { display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none",
                     borderBottom: "1px solid #eef3f5", background: "transparent", cursor: "pointer", fontSize: 14, fontFamily: "inherit", color: "#28444f" }
          }, n.name);
        })) : null,
      // 오늘의 섬. 강제가 아니다 — 눌러도 되고 안 눌러도 되고, 안 누른 것을 기록하지 않는다.
      todayIsle && !matches.length && !listOpen ? React.createElement("button", {
        "data-tut": "sea-today", onClick: function () { pick(todayIsle); },
        style: { display: "block", margin: "6px auto 0", padding: "6px 14px", borderRadius: 12, border: "1px solid #ffe2a8",
                 background: "rgba(255,248,230,0.94)", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#8a5a12", fontFamily: "inherit" }
      }, "오늘은 ", React.createElement("b", null, todayIsle.name), "의 섬에 놀러 가 볼까요?") : null,
      listOpen ? React.createElement("div", { style: { ...panel, marginTop: 6, maxHeight: "46vh", overflowY: "auto" } },
        names.length ? names.map(function (n) {
          return React.createElement("button", {
            key: String(n.id), onClick: function () { pick(n); },
            style: { display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none",
                     borderBottom: "1px solid #eef3f5", background: "transparent", cursor: "pointer", fontSize: 14, fontFamily: "inherit", color: "#28444f" }
          }, n.name);
        }) : React.createElement("div", { style: { padding: 14, fontSize: 13, fontWeight: 600, color: "#4f6b77" } }, loading || "아직 친구 섬이 없어요")) : null),
    // 조작 안내
    !small ? React.createElement("div", { "data-tut": "sea-hint", className: "tut-dim",
      style: { position: "absolute", left: 10, bottom: 12, padding: "3px 9px", borderRadius: 8,
               background: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: 700, color: "#2b4650" }   // 굵게·어둡게(2026-09-15 저녁)
    }, touch ? "섬을 누르면 가까이 보여요  두 번 누르면 바로 출발  끌어서 둘러보기" : "섬을 누르면 가까이 보여요  두 번 누르면 바로 출발  끌어서 둘러보기  휠로 확대") : null,   // 2026-09-15 저녁: 탭은 고르기, 출발은 카드  2026-09-16: 두 번 누르면 바로
    loading ? React.createElement("div", { className: "tut-dim",
      style: { position: "absolute", left: "50%", bottom: 18, transform: "translateX(-50%)", padding: "6px 14px", borderRadius: 10,
               background: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 700, color: "#2b4650" }
    }, loading) : null,
    // 고른 섬 배너. 배너가 곧 버튼이다(③-8과 같은 방식).
    sel && !sailing ? React.createElement("div", { className: "tut-dim",
      style: { position: "absolute", left: "50%", bottom: small ? 60 : 18, transform: "translateX(-50%)",
               display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap",
               padding: "8px 10px 8px 18px", borderRadius: 14, background: "rgba(255,255,255,0.94)",
               boxShadow: "0 3px 14px rgba(0,0,0,0.18)", fontSize: 15, color: "#28444f" }
    },
      React.createElement("b", { style: { color: "#0e7490" } }, sel.home ? "내 섬" : sel.name),
      React.createElement("button", {
        onClick: function () { if (sel.home) { if (api.current.homeSail) api.current.homeSail(); } else if (api.current.sail) api.current.sail(sel.id); },
        style: { ...bPri, padding: "7px 14px", fontSize: 14 }
      }, "배 타고 가기"),
      React.createElement("button", {
        onClick: function () { setSel(null); },
        style: { background: "transparent", border: "none", cursor: "pointer", fontSize: 16, color: "#94a3b8", padding: "2px 4px" }
      }, "✕")) : null,
    sailing ? React.createElement("div", { className: "tut-dim",
      style: { position: "absolute", left: "50%", bottom: small ? 60 : 18, transform: "translateX(-50%)", whiteSpace: "nowrap",
               padding: "9px 18px", borderRadius: 14, background: "rgba(255,255,255,0.9)", fontSize: 15, color: "#28444f" }
    }, React.createElement("b", { style: { color: "#0e7490" } }, sailing.label)) : null);   // ⑥-1의 "섬 구경은 아직 준비 중이에요" 도착 팝업은 ⑥-2 뒤로 닿을 수 없어 지웠다(2026-09-15 저녁)
}
