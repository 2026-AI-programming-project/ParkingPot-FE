import { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import logo from "./assets/logo.svg";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://192.168.1.57:8000"
).replace(/\/$/, "");

async function api(path, { method = "GET", body, token, signal } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    signal,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const detail = data?.detail;
    const detailMessage = Array.isArray(detail)
      ? detail
          .map((item) => {
            const field = Array.isArray(item.loc)
              ? item.loc.filter((part) => part !== "body").join(".")
              : "";
            return `${field ? `${field}: ` : ""}${item.msg || JSON.stringify(item)}`;
          })
          .join("; ")
      : typeof detail === "string"
        ? detail
        : detail
          ? JSON.stringify(detail)
          : "";
    throw new Error(
      `${data?.message || detailMessage || "요청에 실패했습니다."} (${response.status}) · ${method} ${response.url}`,
    );
  }
  return data;
}

function listFrom(data, keys = []) {
  if (Array.isArray(data)) return data;
  for (const key of [...keys, "items", "results", "data"]) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

function Icon({ name, size = 22, fill = "none" }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill,
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  const paths = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v12h14V9M9 21v-7h6v7" />
      </>
    ),
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </>
    ),
    heart: (
      <path d="M20.8 8.8c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11a4.8 4.8 0 0 1 8.8-2.7 4.8 4.8 0 0 1 8.8 2.7Z" />
    ),
    user: (
      <>
        <circle cx="12" cy="7.5" r="4" />
        <path d="M4 21v-1.5a8 8 0 0 1 16 0V21" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    car: (
      <>
        <path d="m5 11 1.5-5h11l1.5 5 2 2v5h-2v-2H5v2H3v-5l2-2Z" />
        <path d="M6.5 11h11M6 14h.01M18 14h.01" />
      </>
    ),
    receipt: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
  };
  return <svg {...common}>{paths[name]}</svg>;
}

function Logo() {
  return (
    <header className="topbar">
      <img className="brand-logo" src={logo} alt="Parkingpot" />
    </header>
  );
}

function ParkingCard({ lot, saved, onSave, onOpen, compact = false }) {
  const id = lot.id;
  const title = lot.name || lot.parking_name || "주차장";
  const address = lot.address || "주소 정보 없음";
  const rating = lot.rating ?? lot.average_rating;
  const fee = lot.fee ?? lot.hourly_fee ?? lot.price;
  const state = lot.congestion?.status || lot.congestion_status || "정보 없음";
  const stateClass = /여유|원활/.test(state)
    ? "green"
    : /혼잡/.test(state)
      ? "red"
      : /보통/.test(state)
        ? "orange"
        : "neutral";
  return (
    <article
      className={`parking-card ${compact ? "compact" : ""}`}
      onClick={() => onOpen?.(lot)}
    >
      <div className="parking-icon">P</div>
      <div className="parking-info">
        <div className="parking-title-row">
          <h3>{title}</h3>
          <span className={`status ${stateClass}`}>
            <i />
            {state}
          </span>
        </div>
        <p className="address">{address}</p>
        <div className="details">
          {rating != null && (
            <>
              <span className="rating">★</span>
              <b>{rating}</b>
              <span className="divider" />
            </>
          )}
          {fee != null && (
            <>
              <span>요금</span>
              <strong>{fee}</strong>
            </>
          )}
        </div>
      </div>
      {id != null && (
        <button
          className={`save-button ${saved ? "saved" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onSave(id);
          }}
          aria-label={saved ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        >
          <Icon name="heart" size={19} fill={saved ? "currentColor" : "none"} />
        </button>
      )}
      <span className="chevron">›</span>
    </article>
  );
}

function DetailPage({
  lot,
  detail,
  congestion,
  reviews,
  loadingReviews,
  reviewError,
  onBack,
  saved,
  onSave,
  token,
  onReviewAdded,
}) {
  const [reviewText, setReviewText] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const info = detail || lot || {};
  const id = info.id ?? lot.id;
  const name = info.name || info.parking_name || lot.name || "주차장";
  const address = info.address || lot.address || "";
  const rating = info.rating ?? info.average_rating;
  const fee = info.fee ?? info.hourly_fee;
  const hours = info.operating_hours || info.hours;
  const accessibility = info.accessible ?? info.accessibility;
  const available =
    congestion?.available_spaces ??
    congestion?.remaining_spaces ??
    info.available_spaces;
  const total = congestion?.total_spaces ?? info.total_spaces;
  const status =
    congestion?.status ||
    congestion?.congestion_status ||
    info.congestion_status ||
    "정보 없음";
  const submitReview = async (event) => {
    event.preventDefault();
    setReviewMessage("");
    try {
      await api(`/parking-lots/${id}/reviews`, {
        method: "POST",
        token,
        body: { content: reviewText },
      });
      setReviewText("");
      setReviewMessage("댓글이 등록되었습니다.");
      onReviewAdded();
    } catch (error) {
      setReviewMessage(error.message);
    }
  };
  return (
    <div className="detail-screen">
      <div className="detail-map">
        <button className="detail-back" onClick={onBack} aria-label="뒤로">
          ‹
        </button>
        <img className="detail-logo" src={logo} alt="Parkingpot" />
        <button
          className={`detail-heart ${saved ? "saved" : ""}`}
          onClick={() => onSave(id)}
          aria-label="즐겨찾기"
        >
          <Icon name="heart" fill={saved ? "currentColor" : "none"} />
        </button>
        <div className="map-art detail-map-art">
          <span className="map-distance">
            <Icon name="pin" size={15} /> 지도 미리보기
          </span>
        </div>
      </div>
      <main className="detail-content">
        <span className="status neutral">
          <i />
          {status}
        </span>
        <h1>{name}</h1>
        <p className="detail-address">{address}</p>
        <section className="capacity-card">
          <div className="capacity-icon">
            <Icon name="car" size={23} />
          </div>
          <div className="capacity-copy">
            <span>현재 주차 가능</span>
            <strong>
              {available == null ? "정보 없음" : `${available}대`}{" "}
              {total != null && <small>/ 총 {total}대</small>}
            </strong>
          </div>
          <div className="capacity-meter">
            <i />
          </div>
        </section>
        <section className="facts-grid">
          <div>
            <span>이용 요금</span>
            <b>{fee ?? "정보 없음"}</b>
          </div>
          <div>
            <span>이용 시간</span>
            <b>{hours ?? "정보 없음"}</b>
          </div>
          <div>
            <span>이용자 평점</span>
            <b>
              {rating == null ? (
                "정보 없음"
              ) : (
                <>
                  <em>★</em> {rating}
                  {info.rating_count != null ? ` (${info.rating_count})` : ""}
                </>
              )}
            </b>
          </div>
          <div>
            <span>장애인 주차</span>
            <b>
              {accessibility == null
                ? "정보 없음"
                : accessibility
                  ? "가능"
                  : "불가"}
            </b>
          </div>
        </section>
        <div className="review-section">
          <p className="eyebrow">이용자 후기</p>
          <div className="review-heading">
            <h2>주차장 리뷰</h2>
            <span className="count">{reviews.length}</span>
          </div>
          {loadingReviews ? (
            <p className="api-message">리뷰를 불러오는 중입니다.</p>
          ) : reviewError ? (
            <p className="api-message error">{reviewError}</p>
          ) : reviews.length ? (
            reviews.map((review, index) => (
              <article
                className="review-card"
                key={review.id || `${review.user_id}-${index}`}
              >
                <div className="review-avatar">
                  <Icon name="user" size={18} />
                </div>
                <div className="review-copy">
                  <div>
                    <b>{review.user_nickname || review.user_id || "회원"}</b>
                    <time>
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString(
                            "ko-KR",
                          )
                        : ""}
                    </time>
                  </div>
                  <p>{review.content}</p>
                </div>
              </article>
            ))
          ) : (
            <p className="api-message">등록된 리뷰가 없습니다.</p>
          )}
          {token && (
            <form className="review-form" onSubmit={submitReview}>
              <textarea
                maxLength={300}
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="이 주차장을 이용한 경험을 남겨주세요."
                required
              />
              <button disabled={!reviewText.trim()}>리뷰 등록</button>
            </form>
          )}
          {reviewMessage && <p className="api-message">{reviewMessage}</p>}
        </div>
      </main>
      <button
        className="route-button"
        onClick={() => {
          if (info.lat != null && info.lon != null)
            window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${info.lat},${info.lon}`,
              "_blank",
              "noopener,noreferrer",
            );
        }}
      >
        <Icon name="pin" /> 길찾기
      </button>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [lots, setLots] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [anonymousToken, setAnonymousToken] = useState(() =>
    localStorage.getItem("parkingpot-anonymous-token"),
  );
  const [token, setToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [detail, setDetail] = useState(null);
  const [congestion, setCongestion] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupMode, setSignupMode] = useState(false);
  const [signupCode, setSignupCode] = useState("");
  const [signupNickname, setSignupNickname] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [signupCodeSent, setSignupCodeSent] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [emailChange, setEmailChange] = useState({
    email: "",
    code: "",
    sent: false,
  });
  const [passwordChange, setPasswordChange] = useState({
    current: "",
    next: "",
  });

  const ensureAnonymousToken = useCallback(async () => {
    if (anonymousToken) return anonymousToken;
    const session = await api("/sessions/anonymous", { method: "POST" });
    if (!session?.access_token)
      throw new Error("익명 세션 토큰을 받지 못했습니다.");
    localStorage.setItem("parkingpot-anonymous-token", session.access_token);
    setAnonymousToken(session.access_token);
    return session.access_token;
  }, [anonymousToken]);

  const loadFavorites = useCallback(async () => {
    try {
      const session = await ensureAnonymousToken();
      const data = await api("/favorites", { token: session });
      setFavorites(listFrom(data, ["favorites"]));
    } catch (error) {
      setMessage(error.message);
    }
  }, [ensureAnonymousToken]);

  const searchLots = useCallback(
    async (searchText = query, withLocation = false) => {
      setLoading(true);
      setMessage("");
      try {
        const params = new URLSearchParams({
          page: "1",
          page_size: "20",
          sort: "distance",
        });
        if (searchText.trim()) params.set("name", searchText.trim());
        if (withLocation) {
          if (!navigator.geolocation)
            throw new Error("이 기기에서는 위치 정보를 사용할 수 없습니다.");
          const position = await new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(
              resolve,
              () =>
                reject(
                  new Error(
                    "주변 주차장을 찾으려면 위치 권한을 허용하거나 검색어를 입력해 주세요.",
                  ),
                ),
              { timeout: 10000 },
            ),
          );
          params.set("lat", String(position.coords.latitude));
          params.set("lon", String(position.coords.longitude));
          params.set("radius_m", "5000");
        }
        const data = await api(`/parking-lots?${params}`);
        setLots(listFrom(data, ["parking_lots", "items", "results"]));
      } catch (error) {
        setLots([]);
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    },
    [query],
  );

  useEffect(() => {
    if (!token) return undefined;
    const timer = setTimeout(() => searchLots(query, !query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query, searchLots, token]);
  useEffect(() => {
    if (tab === "favorites") loadFavorites();
  }, [tab, loadFavorites]);
  useEffect(() => {
    if (!token) {
      setUser(null);
      setAuthChecked(true);
      return;
    }
    setAuthChecked(false);
    api("/api/users/me", { token })
        .then((data) => {
          setUser(data?.data || data);
          setTab("home");
        })
        .catch((error) => {
          localStorage.removeItem("parkingpot-token");
          setToken(null);
          setUser(null);
          setMessage(error.message);
        })
        .finally(() => setAuthChecked(true));
  }, [token]);

  const openDetail = async (lot) => {
    setSelectedLot(lot);
    setDetail(null);
    setCongestion(null);
    setReviews([]);
    setReviewError("");
    setReviewsLoading(true);
    setMessage("");
    const [detailResult, congestionResult, reviewsResult] = await Promise.allSettled([
      api(`/parking-lots/${lot.id}`),
      api(`/parking-lots/${lot.id}/congestion`),
      api(`/parking-lots/${lot.id}/reviews`),
    ]);
    if (detailResult.status === "fulfilled") {
      const data = detailResult.value;
      setDetail(data?.data || data?.parking_lot || data);
    } else setMessage(detailResult.reason.message);
    if (congestionResult.status === "fulfilled") {
      const data = congestionResult.value;
      setCongestion(data?.data || data);
    } else setCongestion(null);
    if (reviewsResult.status === "fulfilled") {
      setReviews(listFrom(reviewsResult.value, ["reviews", "items", "results"]));
    } else setReviewError(reviewsResult.reason.message);
    setReviewsLoading(false);
  };
  const toggleFavorite = async (id) => {
    try {
      const session = await ensureAnonymousToken();
      const exists = favorites.some(
        (item) => (item.id ?? item.parking_id) === id,
      );
      await api(`/favorites/${id}`, {
        method: exists ? "DELETE" : "PUT",
        token: session,
      });
      await loadFavorites();
    } catch (error) {
      setMessage(error.message);
    }
  };
  const login = async (event) => {
    event.preventDefault();
    setMessage("");
    try {
      const result = await api("/api/auth/login", {
        method: "POST",
        body: { email: loginEmail, password: loginPassword },
      });
      const access = result?.access_token || result?.data?.access_token;
      if (!access) throw new Error("로그인 토큰을 받지 못했습니다.");
      localStorage.setItem("parkingpot-token", access);
      setToken(access);
      setTab("home");
      setLoginPassword("");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const requestSignupCode = async () => {
    setMessage("");
    try {
      await api("/api/auth/email-verifications", {
        method: "POST",
        body: { email: loginEmail, purpose: "signup" },
      });
      setSignupCodeSent(true);
      setMessage("인증번호를 요청했습니다.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const signup = async (event) => {
    event.preventDefault();
    setMessage("");
    if (loginPassword !== signupPasswordConfirm) {
      setMessage("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    try {
      await api("/api/auth/signup", {
        method: "POST",
        body: {
          email: loginEmail,
          password: loginPassword,
          nickname: signupNickname,
          verification_code: signupCode,
          password_confirm: signupPasswordConfirm,
        },
      });
      setSignupMode(false);
      setMessage("회원가입이 완료되었습니다. 로그인해 주세요.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const updateProfile = async (event) => {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const updated = await api("/api/users/me", {
        method: "PATCH",
        token,
        body: { nickname: form.get("nickname") },
      });
      setUser(updated?.data || updated);
      setEditingProfile(false);
    } catch (error) {
      setMessage(error.message);
    }
  };
  const sendEmailChangeCode = async () => {
    try {
      await api("/api/auth/email-verifications", {
        method: "POST",
        token,
        body: { email: emailChange.email, purpose: "email_change" },
      });
      setEmailChange((value) => ({ ...value, sent: true }));
      setMessage("이메일 인증번호를 요청했습니다.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const updateEmail = async (event) => {
    event.preventDefault();
    try {
      const updated = await api("/api/users/me", {
        method: "PATCH",
        token,
        body: { email: emailChange.email, verification_code: emailChange.code },
      });
      setUser(updated?.data || updated);
      setEmailChange({ email: "", code: "", sent: false });
      setMessage("이메일을 변경했습니다.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const updatePassword = async (event) => {
    event.preventDefault();
    try {
      await api("/api/users/me/password/verify", {
        method: "POST",
        token,
        body: { password: passwordChange.current },
      });
      await api("/api/users/me", {
        method: "PATCH",
        token,
        body: { password: passwordChange.next },
      });
      setPasswordChange({ current: "", next: "" });
      setMessage("비밀번호를 변경했습니다.");
    } catch (error) {
      setMessage(error.message);
    }
  };
  const deleteAccount = async () => {
    if (!window.confirm("회원 계정을 삭제할까요?")) return;
    try {
      await api("/api/users/me", { method: "DELETE", token });
      localStorage.removeItem("parkingpot-token");
      setToken(null);
      setUser(null);
    } catch (error) {
      setMessage(error.message);
    }
  };
  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST", token });
    } catch (error) {
      setMessage(error.message);
    } finally {
      localStorage.removeItem("parkingpot-token");
      setToken(null);
      setUser(null);
    }
  };

  const favoriteIds = useMemo(
    () => new Set(favorites.map((item) => item.id ?? item.parking_id)),
    [favorites],
  );
  const visibleLots = tab === "favorites" ? favorites : lots;
  const renderContent = () => {
    if (selectedLot)
      return (
        <DetailPage
          lot={selectedLot}
          detail={detail}
          congestion={congestion}
          reviews={reviews}
          loadingReviews={reviewsLoading}
          reviewError={reviewError}
          onBack={() => setSelectedLot(null)}
          saved={favoriteIds.has(selectedLot.id)}
          onSave={toggleFavorite}
          token={token}
          onReviewAdded={() => openDetail(selectedLot)}
        />
      );
    if (tab === "mypage")
      return (
        <main className="page my-page">
          <p className="eyebrow">내 정보</p>
          <h1>마이페이지</h1>
          {user ? (
            <>
              <section className="profile-card">
                <div className="avatar">
                  <Icon name="user" />
                </div>
                <div>
                  <h2>{user.nickname}</h2>
                  <p>{user.email}</p>
                </div>
                <button
                  className="edit-button"
                  onClick={() => setEditingProfile(!editingProfile)}
                >
                  수정
                </button>
              </section>
              {editingProfile && (
                <>
                  <form className="login-form" onSubmit={updateProfile}>
                    <h2>닉네임 변경</h2>
                    <label>
                      닉네임
                      <input
                        name="nickname"
                        defaultValue={user.nickname}
                        required
                      />
                    </label>
                    <button className="primary-button">저장</button>
                  </form>
                  <form className="login-form" onSubmit={updateEmail}>
                    <h2>이메일 변경</h2>
                    <label>
                      새 이메일
                      <input
                        type="email"
                        value={emailChange.email}
                        onChange={(event) =>
                          setEmailChange((value) => ({
                            ...value,
                            email: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    {emailChange.sent && (
                      <label>
                        인증번호
                        <input
                          value={emailChange.code}
                          onChange={(event) =>
                            setEmailChange((value) => ({
                              ...value,
                              code: event.target.value,
                            }))
                          }
                          required
                        />
                      </label>
                    )}
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={sendEmailChangeCode}
                    >
                      인증번호 요청
                    </button>
                    {emailChange.sent && (
                      <button className="primary-button">이메일 변경</button>
                    )}
                  </form>
                  <form className="login-form" onSubmit={updatePassword}>
                    <h2>비밀번호 변경</h2>
                    <label>
                      현재 비밀번호
                      <input
                        type="password"
                        value={passwordChange.current}
                        onChange={(event) =>
                          setPasswordChange((value) => ({
                            ...value,
                            current: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <label>
                      새 비밀번호
                      <input
                        type="password"
                        value={passwordChange.next}
                        onChange={(event) =>
                          setPasswordChange((value) => ({
                            ...value,
                            next: event.target.value,
                          }))
                        }
                        required
                      />
                    </label>
                    <button className="primary-button">비밀번호 변경</button>
                  </form>
                </>
              )}
              <section className="account-card">
                <div className="account-heading">
                  <div>
                    <small>로그인 계정</small>
                    <h2>내 계정 정보</h2>
                  </div>
                </div>
                <div className="account-row">
                  <span>이메일</span>
                  <b>{user.email}</b>
                </div>
                <div className="account-row">
                  <span>닉네임</span>
                  <b>{user.nickname}</b>
                </div>
              </section>
              <button className="primary-button" onClick={logout}>
                로그아웃
              </button>
              <button className="account-delete" onClick={deleteAccount}>
                회원 탈퇴
              </button>
              {message && <p className="api-message">{message}</p>}
            </>
          ) : (
            <>
              <form
                className="login-form"
                onSubmit={signupMode ? signup : login}
              >
                <h2>{signupMode ? "회원가입" : "로그인"}</h2>
                <label>
                  이메일
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    required
                  />
                </label>
                {signupMode && (
                  <>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={requestSignupCode}
                    >
                      인증번호 요청
                    </button>
                    {signupCodeSent && (
                      <label>
                        인증번호
                        <input
                          value={signupCode}
                          onChange={(event) =>
                            setSignupCode(event.target.value)
                          }
                          required
                        />
                      </label>
                    )}
                    <label>
                      닉네임
                      <input
                        value={signupNickname}
                        onChange={(event) =>
                          setSignupNickname(event.target.value)
                        }
                        required
                      />
                    </label>
                  </>
                )}
                <label>
                  비밀번호
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    required
                  />
                </label>
                {signupMode && (
                  <label>
                    비밀번호 확인
                    <input
                      type="password"
                      name="password_confirm"
                      autoComplete="new-password"
                      value={signupPasswordConfirm}
                      onChange={(event) => setSignupPasswordConfirm(event.target.value)}
                      required
                    />
                  </label>
                )}
                <button className="primary-button">
                  {signupMode ? "가입하기" : "로그인"}
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    setSignupMode(!signupMode);
                    setMessage("");
                  }}
                >
                  {signupMode ? "로그인으로 돌아가기" : "회원가입"}
                </button>
              </form>
              {message && <p className="api-message error">{message}</p>}
            </>
          )}
        </main>
      );
    if (tab === "favorites")
      return (
        <main className="page favorites-page">
          <p className="eyebrow">나만의 주차장</p>
          <h1>즐겨찾기</h1>
          <p className="subhead">자주 찾는 주차장을 빠르게 확인하세요.</p>
          {favorites.length ? (
            <section className="favorite-list">
              {favorites.map((lot) => (
                <ParkingCard
                  key={lot.id ?? lot.parking_id}
                  lot={lot}
                  saved
                  onSave={toggleFavorite}
                  onOpen={openDetail}
                />
              ))}
            </section>
          ) : (
            <div className="empty-state">
              <div className="empty-heart">
                <Icon name="heart" size={34} />
              </div>
              <h2>저장한 주차장이 없어요</h2>
              <p>
                주차장 카드의 하트를 눌러
                <br />
                즐겨찾기에 추가해 보세요.
              </p>
              <button
                className="primary-button"
                onClick={() => setTab("search")}
              >
                주차장 둘러보기
              </button>
            </div>
          )}
        </main>
      );
    if (tab === "home")
      return (
        <>
          <div className="map-filters">
            <button className="active">거리순⌄</button>
            <button>요금⌄</button>
            <button>♿ 장애인 주차</button>
          </div>
          <div className="map-art">
            <span className="map-location">
              <Icon name="pin" size={16} /> 지도 미리보기
            </span>
          </div>
          <main className="page map-results">
            <div className="section-heading">
              <div>
                <h2>주변 주차장</h2>
                <p>지도 주변 검색 결과</p>
              </div>
              <span className="live">
                <i />
                실시간
              </span>
            </div>
            {lots.map((lot) => (
              <ParkingCard
                key={lot.id}
                lot={lot}
                saved={favoriteIds.has(lot.id)}
                onSave={toggleFavorite}
                onOpen={openDetail}
                compact
              />
            ))}
          </main>
        </>
      );
    return (
      <main className="page search-page">
        <p className="eyebrow">주차장 검색</p>
        <h1>
          목적지 주변 주차장을
          <br />
          찾아보세요
        </h1>
        <label className="search-box">
          <Icon name="search" size={21} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="목적지 주소 또는 주차장 이름"
          />
        </label>
        <div className="section-heading">
          <div>
            <h2>추천 주차장</h2>
            <p>{query ? "검색 결과" : "현재 위치에서 가까운 주차장"}</p>
          </div>
          <span className="count">{lots.length}</span>
        </div>
        {loading && <p className="api-message">주차장을 불러오는 중입니다.</p>}
        {message && <p className="api-message error">{message}</p>}
        <section className="parking-list">
          {visibleLots.map((lot) => (
            <ParkingCard
              key={lot.id}
              lot={lot}
              saved={favoriteIds.has(lot.id)}
              onSave={toggleFavorite}
              onOpen={openDetail}
            />
          ))}
        </section>
        {!loading && !message && lots.length === 0 && (
          <p className="api-message">검색 결과가 없습니다.</p>
        )}
      </main>
    );
  };

  if (!authChecked) {
    return (
      <div className="app-shell">
        <Logo />
        <div className="screen auth-loading" aria-label="로그인 확인 중" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="app-shell">
        <Logo />
        <div className="screen login-screen">
          <main className="page login-page">
            <p className="eyebrow">{signupMode ? "새 계정 만들기" : "주차를 더 편하게"}</p>
            <h1>{signupMode ? "회원가입" : "로그인"}</h1>
            <form className="login-form" onSubmit={signupMode ? signup : login}>
              <label>
                이메일
                <input type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} required />
              </label>
              {signupMode && (
                <>
                  <button type="button" className="secondary-button" onClick={requestSignupCode}>인증번호 요청</button>
                  {signupCodeSent && <label>인증번호<input value={signupCode} onChange={(event) => setSignupCode(event.target.value)} required /></label>}
                  <label>닉네임<input value={signupNickname} onChange={(event) => setSignupNickname(event.target.value)} required /></label>
                </>
              )}
              <label>
                비밀번호
                <input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required />
              </label>
              {signupMode && (
                <label>
                  비밀번호 확인
                  <input type="password" name="password_confirm" autoComplete="new-password" value={signupPasswordConfirm} onChange={(event) => setSignupPasswordConfirm(event.target.value)} required />
                </label>
              )}
              <button className="primary-button">{signupMode ? "가입하기" : "로그인"}</button>
              <button type="button" className="text-button" onClick={() => { setSignupMode(!signupMode); setMessage(""); setSignupCodeSent(false); }}>
                {signupMode ? "로그인으로 돌아가기" : "회원가입"}
              </button>
            </form>
            {message && <p className="api-message error">{message}</p>}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {!selectedLot && (
        <>
          <Logo />
          <div className={`screen ${tab === "home" ? "map-screen" : ""}`}>
            {renderContent()}
          </div>
          <nav className="bottom-nav">
            {[
              ["home", "홈"],
              ["search", "검색"],
              ["favorites", "즐겨찾기"],
              ["mypage", "MY"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={tab === key ? "active" : ""}
                onClick={() => {
                  setTab(key);
                  setMessage("");
                }}
              >
                <Icon
                  name={
                    key === "mypage"
                      ? "user"
                      : key === "favorites"
                        ? "heart"
                        : key === "search"
                          ? "search"
                          : "home"
                  }
                  size={22}
                />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </>
      )}
      {selectedLot && renderContent()}
    </div>
  );
}

export default App;
