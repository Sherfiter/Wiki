import Head from 'next/head';
import { useRouter } from 'next/router';

function getCookie(name) {
  const prefix = name + '=';
  const parts = decodeURIComponent(document.cookie).split(';');
  for (let part of parts) {
    while (part.charAt(0) === ' ') part = part.substring(1);
    if (part.indexOf(prefix) === 0) return part.substring(prefix.length, part.length);
  }
  return '';
}

function setCookie(name, value, days) {
  const d = new Date();
  d.setFullYear(d.getFullYear() + days);
  document.cookie = `${name}=${value};expires=${d.toUTCString()};path=/`;
}

function Header() {
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const token = data.get('token');
    setCookie('token', token, 1);
    router.reload(window.location.pathname);
  }

  let token = 'TOKEN';
  if (typeof document !== 'undefined') {
    const c = getCookie('token');
    if (c) token = c;
  }

  return (
    <div className="sticky top-0 z-40 w-full backdrop-blur flex-none border-b border-slate-900/10 bg-white/75 supports-backdrop-blur:bg-white/60">
      <div className="max-w-8xl mx-auto">
        <div className="py-4 border-b border-slate-900/10 lg:px-8 lg:border-0 dark:border-slate-300/10 mx-4 lg:mx-0">
          <div className="relative flex items-center">
            <a href="/">Sherfiter&apos;s wiki</a>
            <form onSubmit={onSubmit} className="text-xs text-slate-500">
              &nbsp;for&nbsp;
              <input
                type="text"
                name="token"
                className="font-mono text-xs w-16"
                maxLength="8"
                defaultValue={token}
                onFocus={(e) => e.target.select()}
              />
            </form>
            <div className="relative hidden lg:flex items-center ml-4 pl-4 border-l">
              <nav className="text-sm leading-6 font-semibold text-slate-700 dark:text-slate-200">
                <ul className="flex space-x-8">
                  <li>
                    <a className="hover:text-sky-500 dark:hover:text-sky-400" href="/interesting/2026/">
                      个人兴趣
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="bg-neutral-100 text-center text-neutral-600 dark:bg-neutral-600 dark:text-neutral-200 lg:text-left">
      <div className="bg-neutral-200 p-6 text-center dark:bg-neutral-700">
        {/* <a rel="license" href="http://creativecommons.org/licenses/by-nc/4.0/">
          Creative Commons License: BY-NC 4.0
        </a> */}
        <br />
        {/* <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">
          苏 ICP 备 2020049101 号
        </a> */}
      </div>
    </div>
  );
}

export default function Layout({ title, children }) {
  return (
    <>
      <Head>
        <title>{title || "Sherfiter's Wiki"}</title>
        <link
          rel="stylesheet"
          href="https://npm.elemecdn.com/lxgw-wenkai-webfont@1.7.0/style.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
        />
        <link
          rel="stylesheet"
          href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/styles/default.min.css"
        />
      </Head>
      <div className="bg-slate-300/10">
        <Header />
        <div className="container mx-auto max-w-5xl flex flex-col min-h-screen px-4">
          {children}
        </div>
        <Footer />
      </div>
    </>
  );
}
