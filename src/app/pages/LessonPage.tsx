// Loads a lesson (its stage chunk) and runs it.
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadLesson } from '../../lessons/stages';
import type { Lesson, Stage } from '../../lessons/types';
import { LessonRunner } from '../../lessons/engine/LessonRunner';
import { getSave } from '../../progress/store';
import { lessonState, nextLesson } from '../../progress/gates';
import { CURRICULUM } from '../../lessons/curriculum';

export default function LessonPage() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<{ lesson: Lesson; stage: Stage } | null | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setData(undefined);
    loadLesson(id).then((d) => live && setData(d));
    return () => { live = false; };
  }, [id]);

  if (data === undefined) return <p className="muted" role="status">Loading lesson…</p>;
  if (data === null) {
    return (
      <div className="card">
        <h2>Lesson not found</h2>
        <button className="btn btn-primary" onClick={() => nav('/')}>Back to the map</button>
      </div>
    );
  }
  const { lesson, stage } = data;
  const meta = CURRICULUM.find((s) => s.id === stage.id)!;
  const state = lessonState(getSave(), meta, lesson.id);
  if (state === 'locked') {
    return (
      <div className="card">
        <h2>Not unlocked yet</h2>
        <p>Finish the lessons before this one first. Step by step!</p>
        <button className="btn btn-primary" onClick={() => nav('/')}>Back to the map</button>
      </div>
    );
  }

  const goNext = () => {
    const n = nextLesson(getSave());
    nav(n ? `/lesson/${n.lessonId}` : '/');
  };

  return (
    <LessonRunner
      key={`${lesson.id}-${attempt}`}
      lesson={lesson}
      stageNumber={stage.number}
      onExit={() => nav('/')}
      onNextLesson={goNext}
      onRetry={() => setAttempt(attempt + 1)}
    />
  );
}
