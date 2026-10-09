import {
  useEffect,
  useState,
  type ReactNode,
  Component,
  type ErrorInfo,
} from "react";
import {
  HashRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Utensils,
  Users,
  RotateCcw,
  UserRound,
  Check,
  Menu,
  X,
} from "lucide-react";
import { StoreProvider, useStore } from "./hooks/useStore";
import SearchPage from "./pages/Search";
import {
  CreateGroup,
  JoinGroup,
  GroupManagement,
  PersonalProfile,
} from "./pages/Groups";
import Detail, { Decision } from "./pages/Detail";
import RestaurantForm from "./pages/RestaurantForm";
import { Empty, Modal } from "./components/ui";
function Shell() {
  const { data, error, reset } = useStore();
  const [resetOpen, setResetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [location.pathname]);
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/" aria-label="mogu ホーム">
            <svg viewBox="0 0 36 36" aria-hidden="true">
              <path
                d="M4 12v12c0 5 7 5 7 0V14c0-5 7-5 7 0v10c0 5 7 5 7 0V14c0-5 7-5 7 0v14"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
            <span>mogu</span>
            <small>みんなで、おいしく。</small>
          </Link>
          <nav className={menuOpen ? "open" : ""}>
            <NavLink to="/" end>
              <Utensils size={17} />
              お店を探す
            </NavLink>
            <NavLink
              to={
                data.groups[0] ? `/groups/${data.groups[0].id}` : "/groups/new"
              }
            >
              <Users size={17} />
              マイグループ
            </NavLink>
            <NavLink to="/restaurants/new">店舗の方へ</NavLink>
          </nav>
          <div className="header-actions">
            <span className="demo-pill">DEMO</span>
            <button
              className="icon-button reset-button"
              aria-label="デモデータをリセット"
              title="デモデータをリセット"
              onClick={() => setResetOpen(true)}
            >
              <RotateCcw size={18} />
            </button>
            <Link
              className="profile-button"
              to="/profile"
              aria-label="自分のプロフィール"
            >
              <UserRound size={19} />
            </Link>
            <button
              className="icon-button mobile-nav-button"
              aria-label="メニュー"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>
      <main className="main-container">
        {error && (
          <div className="notice" role="alert">
            <p>{error}</p>
            <button className="text-link" onClick={() => setResetOpen(true)}>
              リセット
            </button>
          </div>
        )}
        {resetDone && (
          <div className="green-notice" role="status">
            <Check size={17} />
            初期データに戻しました。
            <button
              className="icon-button"
              aria-label="通知を閉じる"
              onClick={() => setResetDone(false)}
            >
              <X size={15} />
            </button>
          </div>
        )}
        <Routes>
          <Route path="/" element={<SearchPage home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/groups/new" element={<CreateGroup />} />
          <Route path="/join/:id" element={<JoinGroup />} />
          <Route path="/groups/:id" element={<GroupManagement />} />
          <Route path="/groups/:id/decision" element={<Decision />} />
          <Route
            path="/restaurants/new"
            element={<RestaurantForm key="new" />}
          />
          <Route
            path="/restaurants/:id/edit"
            element={<RestaurantForm key={location.pathname} />}
          />
          <Route path="/restaurants/:id" element={<Detail />} />
          <Route path="/profile" element={<PersonalProfile />} />
          <Route path="*" element={<Empty title="ページが見つかりません" />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <Link className="footer-brand" to="/">
          mogu<span>みんなの「食べたい」が、ひとつになる。</span>
        </Link>
        <span>ハッカソンデモ · 店舗・人物・情報は架空です</span>
        <button className="text-link" onClick={() => setResetOpen(true)}>
          初期データにリセット
        </button>
      </footer>
      {resetOpen && (
        <Modal
          title="デモを初期状態に戻しますか？"
          onClose={() => setResetOpen(false)}
        >
          <p>
            追加・編集したグループ、プロフィール、店舗とお店の決定を削除し、20店舗・4人の初期データに戻します。
          </p>
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setResetOpen(false)}
            >
              キャンセル
            </button>
            <button
              className="button primary"
              onClick={() => {
                if (reset()) {
                  setResetOpen(false);
                  setResetDone(true);
                  navigate("/");
                }
              }}
            >
              初期状態に戻す
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }
  render() {
    if (this.state.hasError)
      return (
        <div className="empty">
          <h1>画面を表示できませんでした</h1>
          <p>
            保存データに問題がある可能性があります。再読み込みするか、デモデータをリセットしてください。
          </p>
          <button
            className="button secondary"
            onClick={() => window.location.reload()}
          >
            再読み込み
          </button>
          <button
            className="button primary"
            onClick={() => {
              if (window.confirm("デモの保存データを削除しますか？")) {
                localStorage.removeItem("mogu-demo-v1");
                window.location.reload();
              }
            }}
          >
            データをリセット
          </button>
        </div>
      );
    return this.props.children;
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </StoreProvider>
    </ErrorBoundary>
  );
}
