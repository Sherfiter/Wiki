function ChapterLink({ chapter, direction }) {
  const isPrev = direction === 'prev';
  return (
    <a
      href={chapter.href}
      title={chapter.title}
      className={`group flex w-full flex-col gap-0.5 text-sm sm:max-w-[42%] ${
        isPrev ? 'items-start text-left' : 'items-end text-right'
      }`}
    >
      <span className="text-xs text-slate-400 transition group-hover:text-sky-500">
        {isPrev ? '← 上一章' : '下一章 →'}
      </span>
      <span className="font-medium text-slate-700 transition group-hover:text-sky-600">
        {chapter.title}
      </span>
    </a>
  );
}

function ChapterPlaceholder({ direction }) {
  const isPrev = direction === 'prev';
  return (
    <span
      aria-disabled="true"
      className={`flex w-full flex-col gap-0.5 text-sm text-slate-400 sm:max-w-[42%] ${
        isPrev ? 'items-start text-left' : 'items-end text-right'
      }`}
    >
      <span className="text-xs">{isPrev ? '← 上一章' : '下一章 →'}</span>
      <span className="font-medium">{isPrev ? '已经是第一章' : '已经是最后一章'}</span>
    </span>
  );
}

export default function CourseNav({ nav }) {
  if (!nav) return null;

  return (
    <nav
      aria-label="课程章节导航"
      className="mb-12 mt-4 flex w-full max-w-3xl flex-col gap-3 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-6"
    >
      {nav.prev ? <ChapterLink chapter={nav.prev} direction="prev" /> : <ChapterPlaceholder direction="prev" />}

      <a
        href={nav.course.href}
        title={`返回《${nav.course.title}》目录`}
        className="order-last flex shrink-0 flex-col items-center gap-0.5 text-center font-semibold text-slate-600 transition hover:text-sky-600 sm:order-none"
      >
        <span>返回目录</span>
        <span className="text-xs font-normal text-slate-400">
          {nav.course.title} · 第 {nav.position} / {nav.total} 章
        </span>
      </a>

      {nav.next ? <ChapterLink chapter={nav.next} direction="next" /> : <ChapterPlaceholder direction="next" />}
    </nav>
  );
}
