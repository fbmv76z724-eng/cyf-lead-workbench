import { useState, type FormEvent } from "react";
import { KeyRound, LoaderCircle } from "lucide-react";
import { Button } from "../components/Button";

interface LoginPageProps {
  signIn: (email: string, password: string) => Promise<void>;
  error?: string;
}

export function LoginPage({ signIn, error = "" }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFeedback("");
    if (!email.trim() || !password) {
      setFeedback("请输入邮箱和密码。");
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      setFeedback("登录失败，请检查邮箱和密码。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-mark">
          <KeyRound aria-hidden="true" size={24} />
        </div>
        <div>
          <p className="eyebrow">CYF Workbench</p>
          <h1 id="login-title">登录司服线索台</h1>
          <p>请使用管理员分配的账号登录。</p>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <label className="field">
            <span>邮箱</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>
          <label className="field">
            <span>密码</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          {feedback || error ? (
            <p className="auth-error" role="alert">
              {feedback || error}
            </p>
          ) : null}
          <Button
            disabled={submitting}
            icon={
              submitting ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="is-spinning"
                  size={17}
                />
              ) : (
                <KeyRound aria-hidden="true" size={17} />
              )
            }
            type="submit"
            variant="primary"
          >
            {submitting ? "登录中" : "登录"}
          </Button>
        </form>
      </section>
    </main>
  );
}
