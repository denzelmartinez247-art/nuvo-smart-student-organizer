import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  ArrowRight, Bot, CalendarDays, Check, ChevronLeft, Clock3,
  Home as HomeIcon, ListTodo, LogOut, Plus, Send, Sparkles, Star, Trash2, UserRound,
  Button, Input, ScrollView, Separator, SizableText, Spinner, XStack, YStack,
} from '@blinkdotnew/mobile-ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { blink } from '@/lib/blink';
import type { SubjectsRow, TasksRow } from '@/lib/db-types';
import { Screen } from '@/components/Screen';

const C = {
  background: '#F7F6F1', surface: '#FFFFFF', ink: '#202821', muted: '#788078',
  line: '#E9E8E1', green: '#315B45', greenSoft: '#EAF1E9', amber: '#D99848',
  amberSoft: '#FBF1E3', rose: '#C56C60', roseSoft: '#F8EAE7', sage: '#8DA28A',
};
const SUBJECTS = [
  ['Matemáticas', '#668D78', 'book-open'], ['Lengua Española', '#C77A69', 'book-open'],
  ['Ciencias Naturales', '#8A9C63', 'leaf'], ['Ciencias Sociales', '#C08B50', 'globe-2'],
  ['Inglés', '#7188A0', 'languages'], ['Educación Física', '#D47A54', 'activity'],
  ['Formación Integral', '#9B7BA5', 'heart'], ['Educación Artística', '#CF9B62', 'palette'],
  ['Tecnología', '#6C8990', 'cpu'],
] as const;
const PRIORITIES = [
  { id: 'low', label: 'Baja' }, { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'Alta' }, { id: 'urgent', label: 'Urgente' },
] as const;
const tabs = [
  { id: 'home', label: 'Inicio', icon: HomeIcon },
  { id: 'tasks', label: 'Tareas', icon: ListTodo },
  { id: 'calendar', label: 'Agenda', icon: CalendarDays },
  { id: 'ai', label: 'NUVO AI', icon: Sparkles },
  { id: 'profile', label: 'Perfil', icon: UserRound },
] as const;
type TabId = typeof tabs[number]['id'];
type ChatMessage = { role: 'user' | 'assistant'; content: string };
type Priority = typeof PRIORITIES[number]['id'];
const subjectsTable = blink.db.table<SubjectsRow>('subjects');
const tasksTable = blink.db.table<TasksRow>('tasks');

function todayKey() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function dateLabel(value?: string | null) {
  if (!value) return 'Sin fecha';
  if (value === todayKey()) return 'Hoy';
  const next = new Date();
  next.setDate(next.getDate() + 1);
  const tomorrow = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
  if (value === tomorrow) return 'Mañana';
  return new Date(`${value}T12:00:00`).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
}
function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Ocurrió un error. Intenta de nuevo.';
}
function haptic() {
  if (Platform.OS !== 'web') void Haptics.selectionAsync();
}

function TaskRow({
  task, subject, overdue, onToggle, onEdit, onDelete, onStar,
}: {
  task: TasksRow; subject?: SubjectsRow; overdue: boolean;
  onToggle: (task: TasksRow) => void; onEdit: (task: TasksRow) => void;
  onDelete: (task: TasksRow) => void; onStar: (task: TasksRow) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const done = task.status === 'completed';
  return (
    <YStack backgroundColor={C.surface} borderColor={C.line} borderWidth={1} borderRadius={18} padding="$3" gap="$2">
      <XStack alignItems="center" gap="$2">
        <Button unstyled aria-label={done ? 'Restaurar tarea' : 'Completar tarea'} onPress={() => onToggle(task)} minWidth={44} minHeight={44} alignItems="center" justifyContent="center" pressStyle={{ scale: 0.94 }}>
          {done ? <Check size={19} color={C.green} /> : <YStack width={20} height={20} borderWidth={1.5} borderColor={C.sage} borderRadius={99} />}
        </Button>
        <YStack flex={1} gap="$1" onPress={() => onEdit(task)}>
          <SizableText size="$4" fontWeight="600" color={done ? C.muted : C.ink} textDecorationLine={done ? 'line-through' : 'none'}>{task.title}</SizableText>
          <XStack alignItems="center" gap="$2">
            <YStack width={7} height={7} borderRadius={99} backgroundColor={subject?.color ?? C.sage} />
            <SizableText size="$2" color={C.muted}>{subject?.name ?? 'Sin materia'}</SizableText>
            <SizableText size="$2" color={overdue ? C.rose : C.muted}>· {overdue ? 'Atrasada' : dateLabel(task.dueDate)}</SizableText>
          </XStack>
        </YStack>
        <Button unstyled aria-label={task.isStarred ? 'Quitar de importantes' : 'Marcar importante'} onPress={() => onStar(task)} minWidth={42} minHeight={42} alignItems="center" justifyContent="center" pressStyle={{ opacity: 0.6 }}>
          <Star size={17} color={task.isStarred ? C.amber : '#B8B9B0'} fill={task.isStarred ? C.amber : 'transparent'} />
        </Button>
        <Button unstyled aria-label="Eliminar tarea" onPress={() => setConfirming(true)} minWidth={42} minHeight={42} alignItems="center" justifyContent="center" pressStyle={{ opacity: 0.6 }}>
          <Trash2 size={17} color={C.muted} />
        </Button>
      </XStack>
      {confirming ? (
        <XStack alignItems="center" justifyContent="flex-end" gap="$2">
          <SizableText size="$2" color={C.muted}>¿Eliminar?</SizableText>
          <Button size="$2" backgroundColor={C.roseSoft} color={C.rose} onPress={() => { onDelete(task); setConfirming(false); }}>Eliminar</Button>
          <Button size="$2" backgroundColor={C.line} color={C.ink} onPress={() => setConfirming(false)}>Cancelar</Button>
        </XStack>
      ) : null}
    </YStack>
  );
}

export default function Home() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [tab, setTab] = useState<TabId>('home');
  const [taskFilter, setTaskFilter] = useState('Todas');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TasksRow | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(todayKey());
  const [dueTime, setDueTime] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [thinking, setThinking] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => blink.auth.onAuthStateChanged((state) => {
    setUserId(state.user?.id ?? null);
    setEmail(state.user?.email ?? '');
    setDisplayName(state.user?.displayName ?? '');
    if (!state.isLoading) setAuthLoading(false);
  }), []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void (async () => {
      try {
        const existing = await subjectsTable.list({ where: { userId } });
        if (!existing.length) {
          await subjectsTable.createMany(SUBJECTS.map(([name, color, icon]) => ({ userId, name, color, icon })));
        }
        if (active) await queryClient.invalidateQueries({ queryKey: ['subjects', userId] });
      } catch (error) {
        if (active) setFormError(errorText(error));
      }
    })();
    return () => { active = false; };
  }, [userId, queryClient]);

  const subjectsQuery = useQuery({
    queryKey: ['subjects', userId], enabled: Boolean(userId),
    queryFn: () => subjectsTable.list({ where: { userId: userId! }, orderBy: { name: 'asc' } }),
  });
  const tasksQuery = useQuery({
    queryKey: ['tasks', userId], enabled: Boolean(userId),
    queryFn: () => tasksTable.list({ where: { userId: userId! }, orderBy: { dueDate: 'asc' } }),
  });
  const subjects = subjectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const subjectMap = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);
  const activeTasks = tasks.filter((task) => task.status !== 'completed' && task.status !== 'archived');
  const completedCount = tasks.filter((task) => task.status === 'completed').length;
  const overdueTasks = activeTasks.filter((task) => task.dueDate && task.dueDate < todayKey());
  const todaysTasks = activeTasks.filter((task) => task.dueDate === todayKey());
  const upcomingTasks = activeTasks.filter((task) => task.dueDate && task.dueDate > todayKey()).slice(0, 4);
  const taskError = tasksQuery.error ? errorText(tasksQuery.error) : subjectsQuery.error ? errorText(subjectsQuery.error) : '';

  function openNewTask() {
    setEditing(null); setTitle(''); setDescription(''); setDueDate(todayKey()); setDueTime('');
    setSubjectId(subjects[0]?.id ?? ''); setPriority('normal'); setFormError(''); setFormOpen(true);
  }
  function openEditTask(task: TasksRow) {
    setEditing(task); setTitle(task.title); setDescription(task.description ?? '');
    setDueDate(task.dueDate ?? ''); setDueTime(task.dueTime ?? ''); setSubjectId(task.subjectId ?? '');
    setPriority((task.priority as Priority) ?? 'normal'); setFormError(''); setFormOpen(true);
  }
  async function saveTask() {
    if (!title.trim()) { setFormError('Escribe un título para la tarea.'); return; }
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) { setFormError('Usa el formato de fecha AAAA-MM-DD.'); return; }
    if (!userId) return;
    setSaving(true); setFormError('');
    try {
      const patch = { title: title.trim(), description: description.trim(), dueDate: dueDate || null, dueTime: dueTime || null, subjectId: subjectId || null, priority };
      if (editing) await tasksTable.update(editing.id, patch);
      else await tasksTable.create({ ...patch, userId, status: 'pending', isStarred: false, subtasks: '[]', completedAt: null });
      await queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
      setFormOpen(false); setTab('tasks'); haptic();
    } catch (error) { setFormError(errorText(error)); }
    finally { setSaving(false); }
  }
  async function toggleTask(task: TasksRow) {
    if (!userId) return;
    try {
      const completed = task.status === 'completed';
      await tasksTable.update(task.id, { status: completed ? 'pending' : 'completed', completedAt: completed ? null : new Date().toISOString() });
      await queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
      haptic();
    } catch (error) { setFormError(errorText(error)); }
  }
  async function starTask(task: TasksRow) {
    if (!userId) return;
    try {
      await tasksTable.update(task.id, { isStarred: !task.isStarred });
      await queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
      haptic();
    } catch (error) { setFormError(errorText(error)); }
  }
  async function deleteTask(task: TasksRow) {
    if (!userId) return;
    try { await tasksTable.delete(task.id); await queryClient.invalidateQueries({ queryKey: ['tasks', userId] }); }
    catch (error) { setFormError(errorText(error)); }
  }
  async function submitAuth() {
    setAuthBusy(true); setAuthError('');
    try {
      if (authMode === 'signup') {
        await blink.auth.signUp({ email: authEmail.trim(), password: authPassword, metadata: { displayName: authName.trim() } });
      } else await blink.auth.signInWithEmail(authEmail.trim(), authPassword);
    } catch (error) { setAuthError(errorText(error)); }
    finally { setAuthBusy(false); }
  }
  async function sendToAI(value = chatDraft) {
    const prompt = value.trim();
    if (!prompt || !userId || thinking) return;
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: prompt }];
    setMessages(nextMessages); setChatDraft(''); setThinking(true); setAiError('');
    const context = activeTasks.slice(0, 12).map((task) => `• ${task.title} / ${subjectMap.get(task.subjectId ?? '')?.name ?? 'sin materia'} / ${dateLabel(task.dueDate)} / prioridad ${task.priority}`).join('\n') || 'Todavía no hay tareas registradas.';
    try {
      const { text } = await blink.ai.generateText({
        messages: [
          { role: 'system', content: `Eres NUVO AI, una tutora académica paciente y asistente de organización estudiantil. Responde en español claro, amable y profesional. Explica el razonamiento paso a paso, ayuda a aprender y ofrece planes realistas con descansos. Usa las tareas del estudiante como contexto autorizado. No juzgues ni inventes datos.\nTareas actuales:\n${context}` },
          ...nextMessages.map((message) => ({ role: message.role, content: message.content })),
        ], maxTokens: 500,
      });
      setMessages((current) => [...current, { role: 'assistant', content: text }]);
    } catch (error) { setAiError(errorText(error)); }
    finally { setThinking(false); }
  }

  if (authLoading) return (
    <Screen backgroundColor={C.background} alignItems="center" justifyContent="center">
      <YStack alignItems="center" gap="$3"><Spinner size="large" color={C.green} /><SizableText color={C.muted}>Preparando tu espacio…</SizableText></YStack>
    </Screen>
  );

  if (!userId) return (
    <Screen backgroundColor={C.background} justifyContent="center" paddingHorizontal="$5">
      <YStack width="100%" maxWidth={420} alignSelf="center" gap="$4">
        <YStack gap="$2" alignItems="center" marginBottom="$3">
          <YStack backgroundColor={C.green} width={64} height={64} borderRadius={22} alignItems="center" justifyContent="center"><SizableText size="$8" color="white" fontWeight="800">N</SizableText></YStack>
          <SizableText size="$8" fontWeight="800" color={C.ink}>NUVO</SizableText>
          <SizableText size="$4" color={C.muted} textAlign="center">Organiza tu presente. Construye tu futuro.</SizableText>
        </YStack>
        {authMode === 'signup' ? <Input value={authName} onChangeText={setAuthName} placeholder="¿Cómo te llamas?" accessibilityLabel="Nombre visible" height={52} borderRadius={15} backgroundColor={C.surface} /> : null}
        <Input value={authEmail} onChangeText={setAuthEmail} placeholder="Correo electrónico" accessibilityLabel="Correo electrónico" keyboardType="email-address" autoCapitalize="none" height={52} borderRadius={15} backgroundColor={C.surface} />
        <Input value={authPassword} onChangeText={setAuthPassword} placeholder="Contraseña" accessibilityLabel="Contraseña" secureTextEntry height={52} borderRadius={15} backgroundColor={C.surface} onSubmitEditing={submitAuth} />
        {authError ? <SizableText color={C.rose} size="$3">{authError}</SizableText> : null}
        <Button onPress={submitAuth} disabled={authBusy || !authEmail.trim() || !authPassword} backgroundColor={C.green} color="white" height={52} borderRadius={16} pressStyle={{ opacity: 0.85, scale: 0.98 }}>
          {authBusy ? <Spinner color="white" /> : authMode === 'signup' ? 'Crear mi cuenta' : 'Iniciar sesión'}
        </Button>
        <Button unstyled minHeight={48} alignItems="center" justifyContent="center" onPress={() => { setAuthMode(authMode === 'signup' ? 'signin' : 'signup'); setAuthError(''); }}>
          <SizableText color={C.green} size="$3">{authMode === 'signup' ? 'Ya tengo una cuenta · Iniciar sesión' : '¿Primera vez en NUVO? Crear cuenta'}</SizableText>
        </Button>
        <SizableText color={C.muted} size="$2" textAlign="center">Tus tareas se guardan de forma privada en tu cuenta.</SizableText>
      </YStack>
    </Screen>
  );

  const filteredTasks = tasks.filter((task) => {
    const query = search.trim().toLocaleLowerCase('es');
    const subjectName = subjectMap.get(task.subjectId ?? '')?.name ?? '';
    const matchesSearch = !query || `${task.title} ${task.description} ${subjectName}`.toLocaleLowerCase('es').includes(query);
    if (!matchesSearch) return false;
    if (taskFilter === 'Hoy') return task.dueDate === todayKey() && task.status !== 'completed';
    if (taskFilter === 'Pendientes') return task.status !== 'completed' && task.status !== 'archived';
    if (taskFilter === 'Completadas') return task.status === 'completed';
    if (taskFilter === 'Atrasadas') return Boolean(task.dueDate && task.dueDate < todayKey() && task.status !== 'completed');
    return task.status !== 'archived';
  });
  const firstName = displayName.trim().split(' ')[0] || 'estudiante';
  const formattedDate = new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Screen backgroundColor={C.background} bottomInset>
      {formOpen ? (
        <YStack flex={1} width="100%" maxWidth={680} alignSelf="center" paddingHorizontal="$4" paddingTop="$3" gap="$4">
          <XStack alignItems="center" gap="$3">
            <Button unstyled aria-label="Volver" onPress={() => setFormOpen(false)} minWidth={44} minHeight={44} alignItems="center" justifyContent="center"><ChevronLeft size={24} color={C.ink} /></Button>
            <YStack><SizableText size="$6" fontWeight="700" color={C.ink}>{editing ? 'Editar tarea' : 'Nueva tarea'}</SizableText><SizableText size="$2" color={C.muted}>Un paso a la vez.</SizableText></YStack>
          </XStack>
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <YStack gap="$4" paddingBottom="$4">
              <YStack gap="$2"><SizableText size="$3" fontWeight="600" color={C.ink}>Título</SizableText><Input value={title} onChangeText={setTitle} placeholder="Ej. Terminar ejercicios de álgebra" accessibilityLabel="Título de la tarea" height={52} borderRadius={15} backgroundColor={C.surface} /></YStack>
              <YStack gap="$2"><SizableText size="$3" fontWeight="600" color={C.ink}>Materia</SizableText><XStack flexWrap="wrap" gap="$2">{subjects.map((subject) => <Button key={subject.id} onPress={() => setSubjectId(subject.id)} backgroundColor={subjectId === subject.id ? C.greenSoft : C.surface} borderColor={subjectId === subject.id ? C.green : C.line} borderWidth={1} color={subjectId === subject.id ? C.green : C.muted} borderRadius={99} size="$3">{subject.name}</Button>)}</XStack></YStack>
              <YStack gap="$2"><SizableText size="$3" fontWeight="600" color={C.ink}>Entrega</SizableText><XStack gap="$2"><Input value={dueDate} onChangeText={setDueDate} placeholder="AAAA-MM-DD" accessibilityLabel="Fecha de entrega" height={50} flex={1} borderRadius={15} backgroundColor={C.surface} /><Input value={dueTime} onChangeText={setDueTime} placeholder="Hora opcional" accessibilityLabel="Hora de entrega" height={50} flex={1} borderRadius={15} backgroundColor={C.surface} /></XStack></YStack>
              <YStack gap="$2"><SizableText size="$3" fontWeight="600" color={C.ink}>Prioridad</SizableText><XStack gap="$2">{PRIORITIES.map((option) => <Button key={option.id} onPress={() => setPriority(option.id)} flex={1} size="$3" borderRadius={13} backgroundColor={priority === option.id ? C.green : C.surface} color={priority === option.id ? 'white' : C.muted} borderColor={C.line} borderWidth={1}>{option.label}</Button>)}</XStack></YStack>
              <YStack gap="$2"><SizableText size="$3" fontWeight="600" color={C.ink}>Notas</SizableText><Input value={description} onChangeText={setDescription} placeholder="Agrega detalles que quieras recordar" accessibilityLabel="Descripción de la tarea" multiline numberOfLines={4} minHeight={100} textAlignVertical="top" borderRadius={15} backgroundColor={C.surface} /></YStack>
              {formError ? <SizableText size="$3" color={C.rose}>{formError}</SizableText> : null}
              <Button onPress={saveTask} disabled={saving} backgroundColor={C.green} color="white" height={52} borderRadius={16} pressStyle={{ opacity: 0.85, scale: 0.98 }}>{saving ? <Spinner color="white" /> : editing ? 'Guardar cambios' : 'Guardar tarea'}</Button>
            </YStack>
          </ScrollView>
        </YStack>
      ) : (
        <>
          <ScrollView flex={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <YStack width="100%" maxWidth={920} alignSelf="center" paddingHorizontal="$4" paddingTop="$3" gap="$5">
              {tab === 'home' ? (
                <>
                  <XStack alignItems="center" justifyContent="space-between">
                    <YStack gap="$1"><SizableText size="$3" color={C.muted}>{formattedDate}</SizableText><SizableText size="$7" fontWeight="700" color={C.ink}>Hola, {firstName}</SizableText><SizableText size="$3" color={C.muted}>Vamos a darle orden a tu día.</SizableText></YStack>
                    <Button unstyled aria-label="Abrir perfil" onPress={() => setTab('profile')} minWidth={48} minHeight={48} alignItems="center" justifyContent="center" backgroundColor={C.greenSoft} borderRadius={18} borderWidth={0}><UserRound size={21} color={C.green} /></Button>
                  </XStack>
                  <XStack gap="$3">
                    <YStack flex={1} backgroundColor={C.green} borderRadius={20} padding="$4" gap="$2"><SizableText size="$2" color="#DCE9DE">PARA HOY</SizableText><SizableText size="$8" fontWeight="700" color="white">{todaysTasks.length}</SizableText><SizableText size="$2" color="#DCE9DE">tareas pendientes</SizableText></YStack>
                    <YStack flex={1} backgroundColor={C.surface} borderRadius={20} padding="$4" gap="$2" borderColor={C.line} borderWidth={1}><SizableText size="$2" color={C.muted}>COMPLETADAS</SizableText><SizableText size="$8" fontWeight="700" color={C.ink}>{completedCount}</SizableText><SizableText size="$2" color={C.muted}>en total</SizableText></YStack>
                  </XStack>
                  {overdueTasks.length ? <XStack backgroundColor={C.roseSoft} borderRadius={15} padding="$3" alignItems="center" gap="$2"><Clock3 size={17} color={C.rose} /><SizableText size="$3" color={C.rose} flex={1}>{overdueTasks.length} {overdueTasks.length === 1 ? 'tarea atrasada' : 'tareas atrasadas'} · puedes retomarla</SizableText></XStack> : null}
                  <YStack gap="$3">
                    <XStack alignItems="center" justifyContent="space-between"><SizableText size="$5" fontWeight="700" color={C.ink}>Mi día</SizableText><Button unstyled minHeight={44} backgroundColor="transparent" borderWidth={0} onPress={() => { setTab('tasks'); setTaskFilter('Hoy'); }}><SizableText size="$3" color={C.green}>Ver todas →</SizableText></Button></XStack>
                    {tasksQuery.isLoading ? <YStack padding="$5" alignItems="center"><Spinner color={C.green} /></YStack> : null}
                    {!tasksQuery.isLoading && todaysTasks.length ? todaysTasks.slice(0, 4).map((task) => <TaskRow key={task.id} task={task} subject={subjectMap.get(task.subjectId ?? '')} overdue={false} onToggle={toggleTask} onEdit={openEditTask} onDelete={deleteTask} onStar={starTask} />) : null}
                    {!tasksQuery.isLoading && !todaysTasks.length ? <YStack padding="$4" borderRadius={18} backgroundColor={C.surface} borderColor={C.line} borderWidth={1} gap="$2"><SizableText size="$4" fontWeight="600" color={C.ink}>Tu día empieza con un primer paso</SizableText><SizableText size="$3" color={C.muted}>Agrega una tarea y aparecerá aquí.</SizableText><Button onPress={openNewTask} alignSelf="flex-start" backgroundColor={C.green} color="white" borderRadius={13} height={44}><Plus size={17} color="white" /> Crear tarea</Button></YStack> : null}
                  </YStack>
                  <YStack gap="$3"><SizableText size="$5" fontWeight="700" color={C.ink}>Próximamente</SizableText>{upcomingTasks.length ? upcomingTasks.map((task) => <TaskRow key={task.id} task={task} subject={subjectMap.get(task.subjectId ?? '')} overdue={false} onToggle={toggleTask} onEdit={openEditTask} onDelete={deleteTask} onStar={starTask} />) : <SizableText size="$3" color={C.muted}>No hay entregas futuras todavía.</SizableText>}</YStack>
                  <YStack backgroundColor={C.amberSoft} borderRadius={20} padding="$4" gap="$2"><XStack alignItems="center" gap="$2"><Sparkles size={18} color={C.amber} /><SizableText size="$4" fontWeight="700" color={C.ink}>Un poco de claridad</SizableText></XStack><SizableText size="$3" color={C.muted}>Pídele a NUVO AI que te ayude a elegir por dónde empezar.</SizableText><Button unstyled minHeight={44} backgroundColor="transparent" borderWidth={0} alignSelf="flex-start" onPress={() => setTab('ai')}><SizableText size="$3" color={C.green} fontWeight="600">Hablar con NUVO AI →</SizableText></Button></YStack>
                </>
              ) : null}

              {tab === 'tasks' ? (
                <>
                  <XStack alignItems="center" justifyContent="space-between"><YStack gap="$1"><SizableText size="$7" fontWeight="700" color={C.ink}>Tareas</SizableText><SizableText size="$3" color={C.muted}>{activeTasks.length} pendientes · {completedCount} completadas</SizableText></YStack><Button onPress={openNewTask} backgroundColor={C.green} color="white" borderRadius={15} height={48}><Plus size={19} color="white" /> Nueva</Button></XStack>
                  <Input value={search} onChangeText={setSearch} placeholder="Buscar por tarea o materia" accessibilityLabel="Buscar tareas" height={48} borderRadius={15} backgroundColor={C.surface} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}><XStack gap="$2">{['Todas', 'Hoy', 'Pendientes', 'Completadas', 'Atrasadas'].map((filter) => <Button key={filter} onPress={() => setTaskFilter(filter)} backgroundColor={taskFilter === filter ? C.green : C.surface} color={taskFilter === filter ? 'white' : C.muted} borderColor={C.line} borderWidth={1} borderRadius={99} size="$3">{filter}</Button>)}</XStack></ScrollView>
                  {taskError ? <YStack backgroundColor={C.roseSoft} padding="$3" borderRadius={14}><SizableText color={C.rose} size="$3">{taskError}</SizableText></YStack> : null}
                  {tasksQuery.isLoading ? <YStack alignItems="center" padding="$6"><Spinner color={C.green} /></YStack> : null}
                  {!tasksQuery.isLoading && filteredTasks.length ? filteredTasks.map((task) => <TaskRow key={task.id} task={task} subject={subjectMap.get(task.subjectId ?? '')} overdue={Boolean(task.dueDate && task.dueDate < todayKey() && task.status !== 'completed')} onToggle={toggleTask} onEdit={openEditTask} onDelete={deleteTask} onStar={starTask} />) : null}
                  {!tasksQuery.isLoading && !filteredTasks.length ? <YStack alignItems="center" padding="$6" gap="$2"><ListTodo size={30} color={C.sage} /><SizableText size="$4" fontWeight="600" color={C.ink}>Todo despejado</SizableText><SizableText size="$3" color={C.muted} textAlign="center">Cuando agregues tareas, podrás encontrarlas aquí.</SizableText></YStack> : null}
                </>
              ) : null}

              {tab === 'calendar' ? (
                <>
                  <YStack gap="$1"><SizableText size="$7" fontWeight="700" color={C.ink}>Agenda</SizableText><SizableText size="$3" color={C.muted}>Tus fechas de entrega, en orden.</SizableText></YStack>
                  <XStack backgroundColor={C.greenSoft} borderRadius={17} padding="$3" alignItems="center" gap="$3"><CalendarDays size={20} color={C.green} /><YStack><SizableText size="$2" color={C.green}>ENTREGAS PROGRAMADAS</SizableText><SizableText size="$4" fontWeight="600" color={C.ink}>{activeTasks.filter((task) => task.dueDate && task.dueDate >= todayKey()).length} tareas con fecha</SizableText></YStack></XStack>
                  {tasksQuery.isLoading ? <YStack alignItems="center" padding="$6"><Spinner color={C.green} /></YStack> : null}
                  {!tasksQuery.isLoading && activeTasks.some((task) => task.dueDate) ? activeTasks.filter((task) => task.dueDate).sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? '')).map((task) => <TaskRow key={task.id} task={task} subject={subjectMap.get(task.subjectId ?? '')} overdue={Boolean(task.dueDate && task.dueDate < todayKey())} onToggle={toggleTask} onEdit={openEditTask} onDelete={deleteTask} onStar={starTask} />) : null}
                  {!tasksQuery.isLoading && !activeTasks.some((task) => task.dueDate) ? <YStack alignItems="center" padding="$6" gap="$2"><CalendarDays size={30} color={C.sage} /><SizableText size="$4" fontWeight="600" color={C.ink}>Aún no hay fechas</SizableText><SizableText size="$3" color={C.muted} textAlign="center">Las tareas con entrega aparecerán aquí.</SizableText><Button onPress={openNewTask} backgroundColor={C.green} color="white" borderRadius={14} height={46}><Plus size={17} color="white" /> Añadir tarea</Button></YStack> : null}
                </>
              ) : null}

              {tab === 'ai' ? (
                <>
                  <XStack alignItems="center" gap="$3"><YStack width={48} height={48} borderRadius={17} backgroundColor={C.amberSoft} alignItems="center" justifyContent="center"><Bot size={23} color={C.amber} /></YStack><YStack><SizableText size="$6" fontWeight="700" color={C.ink}>NUVO AI</SizableText><SizableText size="$2" color={C.muted}>Tu compañera de estudio</SizableText></YStack></XStack>
                  {!messages.length ? <YStack gap="$4" paddingTop="$3"><YStack backgroundColor={C.surface} borderColor={C.line} borderWidth={1} borderRadius={20} padding="$4" gap="$2"><SizableText size="$5" fontWeight="700" color={C.ink}>¿Qué necesitas resolver?</SizableText><SizableText size="$3" color={C.muted}>Puedo explicar un tema o ayudarte a planificar tus tareas. Tendré en cuenta tus entregas pendientes.</SizableText></YStack>
                    <Button onPress={() => { void sendToAI('Ayúdame a priorizar mis tareas'); }} backgroundColor={C.surface} borderColor={C.line} borderWidth={1} color={C.ink} borderRadius={15} height={48} justifyContent="space-between">Ayúdame a priorizar mis tareas<ArrowRight size={16} color={C.sage} /></Button>
                    <Button onPress={() => { void sendToAI('Explícame un concepto paso a paso'); }} backgroundColor={C.surface} borderColor={C.line} borderWidth={1} color={C.ink} borderRadius={15} height={48} justifyContent="space-between">Explícame un concepto paso a paso<ArrowRight size={16} color={C.sage} /></Button>
                    <Button onPress={() => { void sendToAI('¿Cómo puedo organizar mi tarde?'); }} backgroundColor={C.surface} borderColor={C.line} borderWidth={1} color={C.ink} borderRadius={15} height={48} justifyContent="space-between">¿Cómo organizo mi tarde?<ArrowRight size={16} color={C.sage} /></Button>
                  </YStack> : null}
                  {messages.map((message, index) => <YStack key={`${message.role}-${index}`} maxWidth="90%" alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'} backgroundColor={message.role === 'user' ? C.green : C.surface} borderColor={message.role === 'user' ? C.green : C.line} borderWidth={1} borderRadius={18} padding="$3"><SizableText size="$3" color={message.role === 'user' ? 'white' : C.ink}>{message.content}</SizableText></YStack>)}
                  {thinking ? <XStack alignItems="center" gap="$2"><Spinner size="small" color={C.green} /><SizableText size="$2" color={C.muted}>NUVO está pensando…</SizableText></XStack> : null}
                  {aiError ? <YStack backgroundColor={C.roseSoft} padding="$3" borderRadius={14} gap="$2"><SizableText color={C.rose} size="$3">{aiError}</SizableText><SizableText color={C.muted} size="$2">Puedes volver a intentarlo; tus tareas siguen disponibles.</SizableText></YStack> : null}
                </>
              ) : null}

              {tab === 'profile' ? (
                <>
                  <YStack gap="$1"><SizableText size="$7" fontWeight="700" color={C.ink}>Tu espacio</SizableText><SizableText size="$3" color={C.muted}>Tu cuenta y tus materias.</SizableText></YStack>
                  <YStack backgroundColor={C.surface} borderColor={C.line} borderWidth={1} borderRadius={20} padding="$4" gap="$2"><SizableText size="$5" fontWeight="700" color={C.ink}>{displayName || 'Estudiante NUVO'}</SizableText><SizableText size="$3" color={C.muted}>{email}</SizableText></YStack>
                  <YStack gap="$3"><SizableText size="$5" fontWeight="700" color={C.ink}>Materias</SizableText>{subjects.map((subject) => <XStack key={subject.id} alignItems="center" gap="$3" backgroundColor={C.surface} borderColor={C.line} borderWidth={1} borderRadius={15} padding="$3"><YStack width={10} height={10} borderRadius={99} backgroundColor={subject.color} /><SizableText size="$3" color={C.ink}>{subject.name}</SizableText></XStack>)}</YStack>
                  {taskError ? <SizableText size="$3" color={C.rose}>{taskError}</SizableText> : null}
                  <Separator borderColor={C.line} />
                  <Button onPress={() => { void blink.auth.signOut(); }} backgroundColor={C.surface} borderColor={C.line} borderWidth={1} color={C.rose} height={48} borderRadius={15}><LogOut size={17} color={C.rose} /> Cerrar sesión</Button>
                  <SizableText size="$2" color={C.muted} textAlign="center">NUVO · Organiza tu presente. Construye tu futuro.</SizableText>
                </>
              ) : null}
              {formError && !formOpen ? <SizableText size="$2" color={C.rose}>{formError}</SizableText> : null}
            </YStack>
          </ScrollView>
          {tab === 'ai' ? <YStack paddingHorizontal="$3" paddingTop="$2" backgroundColor={C.background} borderTopColor={C.line} borderTopWidth={1}>
            <XStack alignItems="center" gap="$2"><Input value={chatDraft} onChangeText={setChatDraft} placeholder="Escribe tu pregunta…" accessibilityLabel="Mensaje para NUVO AI" flex={1} height={48} borderRadius={16} backgroundColor={C.surface} onSubmitEditing={() => { void sendToAI(); }} /><Button aria-label="Enviar mensaje" onPress={() => { void sendToAI(); }} disabled={!chatDraft.trim() || thinking} backgroundColor={C.green} color="white" width={48} height={48} borderRadius={16} padding={0}><Send size={18} color="white" /></Button></XStack>
            <SizableText size="$1" color={C.muted} textAlign="center" paddingTop="$2" paddingBottom="$1">Las respuestas de IA pueden requerir verificación.</SizableText>
          </YStack> : null}
          <XStack width="100%" maxWidth={640} alignSelf="center" backgroundColor={C.surface} borderTopColor={C.line} borderTopWidth={1} justifyContent="space-around" paddingTop="$2" paddingBottom="$1">
            {tabs.map(({ id, label, icon: Icon }) => <Button key={id} unstyled aria-label={label} onPress={() => { setTab(id); haptic(); }} minWidth={54} minHeight={52} alignItems="center" justifyContent="center" gap="$1" backgroundColor="transparent" borderWidth={0} pressStyle={{ scale: 0.94 }}><Icon size={19} color={tab === id ? C.green : C.muted} /><SizableText size="$1" color={tab === id ? C.green : C.muted} fontWeight={tab === id ? '700' : '500'}>{label}</SizableText></Button>)}
          </XStack>
        </>
      )}
    </Screen>
  );
}
