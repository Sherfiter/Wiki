function ChapterLink({ chapter, direction }) {
  const isPrev = direction === 'prev';
  return (
    <a
      href={chapter.href}
      title={chapter.title}
      className={`group flex min-w-0 items-center gap-3 rounded-lg border border-slate-900/10 bg-white/70 px-4 py-3 text-sm transition hover:border-sky-400 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:border-slate-300/10 dark:bg-slate-800/40 dark:hover:border-sky-400 dark:hover:text-sky-300 ${
        isPrev ? '' : 'flex-row-reverse text-right'
      }`}
    >
      <span aria-hidden="true" className="text-lg leading-none text-slate-400 group-hover:text-sky-500">
        {isPrev ? '←' : '→'}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-normal text-slate-500 dark:text-slate-400">
          {isPrev ? '上一章' : '下一章'}
        </span>
        <span className="block truncate font-semibold">{chapter.title}</span>
      </span>
    </a>
  );
}

function ChapterPlaceholder({ direction }) {
  const isPrev = direction === 'prev';
  return (
    <span
      aria-disabled="true"
      className={`flex items-center gap-3 rounded-lg border border-dashed border-slate-900/10 px-4 py-3 text-sm text-slate-400 dark:border-slate-300/10 dark:text-slate-500 ${
        isPrev ? '' : 'flex-row-reverse text-right'
      }`}
    >
      <span aria-hidden="true" className="text-lg leading-none">
        {isPrev ? '←' : '→'}
      </span>
      <span>
        <span className="block text-xs">{isPrev ? '上一章' : '下一章'}</span>
        <span className="block font-semibold">{isPrev ? '已经是第一章' : '已经是最后一章'}</span>
      </span>
    </span>
  );
}

export default function CourseNav({ nav }) {
  if (!nav) return null;

  return (
    <nav
      aria-label="课程章节导航"
      className="mb-10 mt-12 max-w-[65ch] border-t border-slate-900/10 pt-6 dark:border-slate-300/10"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        {nav.prev ? <ChapterLink chapter={nav.prev} direction="prev" /> : <ChapterPlaceholder direction="prev" />}

        <a
          href={nav.course.href}
          title={`返回《${nav.course.title}》目录`}
          className="order-last col-span-2 flex flex-col items-center justify-center rounded-lg border border-slate-900/15 bg-slate-100 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-sky-400 hover:bg-slate-200 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:order-none sm:col-span-1 dark:border-slate-300/10 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:bg-slate-700/60 dark:hover:text-sky-300"
        >
          <span>返回目录</span>
          <span className="block max-w-[12rem] truncate text-xs font-normal text-slate-500 dark:text-slate-400">
            {nav.course.title} · 第 {nav.position} / {nav.total} 章
          </span>
        </a>

        {nav.next ? <ChapterLink chapter={nav.next} direction="next" /> : <ChapterPlaceholder direction="next" />}
      </div>
    </nav>
  );
}
