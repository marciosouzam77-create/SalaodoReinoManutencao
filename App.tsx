
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MaintenanceState, Volunteer, VolunteerStatus, PlanningItem, ConfirmationStatus, Dc85Item, DocumentFile } from './types.ts';
import { ClockIcon, CalendarIcon, EditIcon, PlusCircleIcon, TrashIcon, UserCheckIcon, UserXIcon, CheckCircleIcon, XCircleIcon, SaveIcon, AlertTriangleIcon } from './components/icons.tsx';

const Section = ({ title, icon, children }: { title: string, icon?: React.ReactNode, children: React.ReactNode }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6 overflow-hidden">
        <h2 className="bg-blue-600 dark:bg-blue-800 text-white p-4 text-xl font-bold flex items-center">
            {icon && <span className="mr-3">{icon}</span>}
            {title}
        </h2>
        <div className="p-4 md:p-6">
            {children}
        </div>
    </div>
);

interface EditableFieldProps {
    value: string;
    onSave: (newValue: string) => void;
    multiline?: boolean;
}

const EditableField: React.FC<EditableFieldProps> = ({ value, onSave, multiline = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);
    
    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleSave = () => {
        if (currentValue.trim() !== '') {
            onSave(currentValue);
        } else {
            setCurrentValue(value);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !multiline) {
            handleSave();
        } else if (e.key === 'Escape') {
            setCurrentValue(value);
            setIsEditing(false);
        }
    };
    
    if (isEditing) {
        return multiline ? (
            <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-white border-blue-400 focus:ring-2 focus:ring-blue-500"
                rows={4}
            />
        ) : (
            <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:text-white border-blue-400 focus:ring-2 focus:ring-blue-500"
            />
        );
    }

    return (
        <div onClick={() => setIsEditing(true)} className="group cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 w-full min-h-[40px] flex items-center">
            <p className="whitespace-pre-wrap flex-grow dark:text-gray-300">{value}</p>
            <EditIcon className="w-4 h-4 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

const App: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const getInitialState = (): MaintenanceState => {
        const planningItemsRaw = [
            'Andaime', 'Aluguel do andaime', 'Responsável aluguel andaime: Eduardo', 'Escada extensível',
            'Escada tesoura', 'Parafusadeira', 'Cadeado disjuntor', 'Serra elétrica',
            'Cinturão 1 Ponto + Talabarte de Segurança Y Dully'
        ];

        return {
            date: '17/01',
            time: '8h',
            services: 'Troca de forros do salão principal e sala B, retiradas das buchas e fechamento dos buracos e limpeza de filtros de ar condicionado.',
            planningItems: planningItemsRaw.sort((a, b) => a.localeCompare(b)).map(task => ({ id: crypto.randomUUID(), task, confirmed: ConfirmationStatus.PENDING })),
            dc85Items: [
                { id: crypto.randomUUID(), key: 'Preparação', value: 'Jonatas' },
                { id: crypto.randomUUID(), key: 'Data de envio limite para o TM', value: '12/01' },
                { id: crypto.randomUUID(), key: 'Responsável da segurança', value: 'Jonatas' },
            ],
            dc85Confirmed: false,
            volunteers: ['Ricardo', 'Jonatas', 'Jessica', 'Danilson', 'Larissa'].map(name => ({ id: crypto.randomUUID(), name, status: VolunteerStatus.PENDING })),
            documents: [{ id: crypto.randomUUID(), name: 'DC-82 (ter seu exemplar pessoal e seguir as orientações dele).' }],
            episRequired: [
                'Calçado de segurança com certificado de aprovação (CA), de acordo com a atividade;',
                'Capacete;', 'Óculos de proteção;', 'Camiseta (sem lemas ou propagandas);',
                'Calça comprida (jeans);', 'Colete refletivo ou camisa de alta visibilidade;',
                'Protetor auricular', 'Luvas tricotada ou vaqueta'
            ],
        };
    };

    const [state, setState] = useState<MaintenanceState>(getInitialState);
    const [isSaved, setIsSaved] = useState(true);

    useEffect(() => {
        try {
            const savedState = localStorage.getItem('maintenanceState');
            if (savedState) {
                setState(JSON.parse(savedState));
            }
        } catch (error) {
            console.error("Failed to load state from localStorage", error);
        }
    }, []);

    const saveState = useCallback(() => {
        try {
            localStorage.setItem('maintenanceState', JSON.stringify(state));
            setIsSaved(true);
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [state]);

    useEffect(() => {
        setIsSaved(false);
        const handler = (event: BeforeUnloadEvent) => {
            saveState();
            delete event['returnValue'];
        };
        window.addEventListener('beforeunload', handler);
        return () => {
            window.removeEventListener('beforeunload', handler);
        };
    }, [state, saveState]);


    const getDayOfWeek = (dateStr: string) => {
        const [day, month] = dateStr.split('/');
        if (!day || !month) return '';
        const year = new Date().getFullYear();
        const date = new Date(year, parseInt(month) - 1, parseInt(day));
        if (isNaN(date.getTime())) return 'Data inválida';
        return date.toLocaleDateString('pt-BR', { weekday: 'long' });
    };

    const updateState = <K extends keyof MaintenanceState>(key: K, value: MaintenanceState[K]) => {
        setState(prevState => ({ ...prevState, [key]: value }));
    };
    
    const handleVolunteerChange = (id: string, newName: string) => {
        const updated = state.volunteers.map(v => v.id === id ? { ...v, name: newName } : v);
        updateState('volunteers', updated);
    };

    const handleVolunteerStatus = (id: string, status: VolunteerStatus) => {
        const updated = state.volunteers.map(v => v.id === id ? { ...v, status } : v);
        updateState('volunteers', updated);
    };
    
    const addVolunteer = () => {
        const newVolunteer: Volunteer = { id: crypto.randomUUID(), name: "Novo Voluntário", status: VolunteerStatus.PENDING };
        updateState('volunteers', [...state.volunteers, newVolunteer]);
    };

    const removeVolunteer = (id: string) => {
        updateState('volunteers', state.volunteers.filter(v => v.id !== id));
    };
    
    const handlePlanningChange = (id: string, newTask: string) => {
        const updated = state.planningItems.map(p => p.id === id ? { ...p, task: newTask } : p);
        updateState('planningItems', updated);
    };

    const handlePlanningConfirm = (id: string, status: ConfirmationStatus) => {
        const updated = state.planningItems.map(p => p.id === id ? { ...p, confirmed: status } : p);
        updateState('planningItems', updated);
    };

    const addPlanningItem = () => {
        const newItem: PlanningItem = { id: crypto.randomUUID(), task: "Nova Tarefa", confirmed: ConfirmationStatus.PENDING };
        const updated = [...state.planningItems, newItem].sort((a, b) => a.task.localeCompare(b.task));
        updateState('planningItems', updated);
    };
    
    const removePlanningItem = (id: string) => {
        updateState('planningItems', state.planningItems.filter(p => p.id !== id));
    };

    const handleDc85Change = (id: string, value: string, field: 'key' | 'value') => {
        const updated = state.dc85Items.map(item => item.id === id ? { ...item, [field]: value } : item);
        updateState('dc85Items', updated);
    };
    
    const addDc85Item = () => {
        const newItem: Dc85Item = { id: crypto.randomUUID(), key: "Novo Campo", value: "Valor" };
        updateState('dc85Items', [...state.dc85Items, newItem]);
    };

    const removeDc85Item = (id: string) => {
        updateState('dc85Items', state.dc85Items.filter(item => item.id !== id));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const newFiles = Array.from(event.target.files).map(file => ({ id: crypto.randomUUID(), name: file.name }));
            const currentFileNames = new Set(state.documents.map(d => d.name));
            const uniqueNewFiles = newFiles.filter(f => !currentFileNames.has(f.name));
            updateState('documents', [...state.documents, ...uniqueNewFiles]);
        }
    };
    
    const removeDocument = (id: string) => {
        updateState('documents', state.documents.filter(d => d.id !== id));
    };
    
    return (
        <div className="min-h-screen text-gray-800 dark:text-gray-200 p-4 sm:p-6 lg:p-8">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciador de Manutenção</h1>
                <div className="flex items-center space-x-2 text-sm">
                    {!isSaved ? (
                         <div className="flex items-center text-yellow-500">
                           <AlertTriangleIcon className="w-4 h-4 mr-1" />
                           <span>Alterações não salvas</span>
                        </div>
                    ) : (
                         <div className="flex items-center text-green-500">
                           <CheckCircleIcon className="w-4 h-4 mr-1" />
                           <span>Salvo</span>
                        </div>
                    )}
                    <button onClick={saveState} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition flex items-center">
                        <SaveIcon className="w-4 h-4 mr-2" />
                        Salvar Agora
                    </button>
                </div>
            </header>
            
            <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                    <Section title="Manutenção Programada" icon={<ClockIcon className="w-6 h-6" />}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                                <CalendarIcon className="w-6 h-6 text-blue-500 mr-3" />
                                <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Data</span>
                                    <EditableField value={state.date} onSave={(v) => updateState('date', v)} />
                                    <span className="text-xs text-gray-400 capitalize">{getDayOfWeek(state.date)}</span>
                                </div>
                            </div>
                            <div className="flex items-center bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                                <ClockIcon className="w-6 h-6 text-blue-500 mr-3" />
                                <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Horário</span>
                                    <EditableField value={state.time} onSave={(v) => updateState('time', v)} />
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Serviços</span>
                            <EditableField value={state.services} onSave={(v) => updateState('services', v)} multiline />
                        </div>
                    </Section>
                </div>

                <div>
                    <Section title="Planejamento">
                        <ul className="space-y-3">
                            {state.planningItems.map(item => (
                                <li key={item.id} className="flex items-center group bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                                    <div className="flex-grow">
                                        <EditableField value={item.task} onSave={(v) => handlePlanningChange(item.id, v)} />
                                    </div>
                                    <div className="flex items-center space-x-2 ml-2">
                                        <button onClick={() => handlePlanningConfirm(item.id, item.confirmed === ConfirmationStatus.YES ? ConfirmationStatus.PENDING : ConfirmationStatus.YES)} className={`px-2 py-1 text-xs rounded ${item.confirmed === ConfirmationStatus.YES ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Sim</button>
                                        <button onClick={() => handlePlanningConfirm(item.id, item.confirmed === ConfirmationStatus.NO ? ConfirmationStatus.PENDING : ConfirmationStatus.NO)} className={`px-2 py-1 text-xs rounded ${item.confirmed === ConfirmationStatus.NO ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Não</button>
                                    </div>
                                    <button onClick={() => removePlanningItem(item.id)} className="ml-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <button onClick={addPlanningItem} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                            <PlusCircleIcon className="w-5 h-5 mr-2" /> Adicionar item de planejamento
                        </button>
                    </Section>

                    <Section title="DC-85">
                         <div className="flex items-center justify-between mb-4">
                            <span className="font-semibold">Confirmação</span>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => updateState('dc85Confirmed', true)} className={`px-3 py-1 text-sm rounded ${state.dc85Confirmed ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Confirmado</button>
                                <button onClick={() => updateState('dc85Confirmed', false)} className={`px-3 py-1 text-sm rounded ${!state.dc85Confirmed ? 'bg-yellow-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>Pendente</button>
                            </div>
                        </div>
                        <ul className="space-y-3">
                            {state.dc85Items.map(item => (
                                <li key={item.id} className="grid grid-cols-3 gap-2 items-center group">
                                    <div className="col-span-1"><EditableField value={item.key} onSave={(v) => handleDc85Change(item.id, v, 'key')} /></div>
                                    <div className="col-span-2 flex items-center">
                                       <div className="flex-grow"><EditableField value={item.value} onSave={(v) => handleDc85Change(item.id, v, 'value')} /></div>
                                        <button onClick={() => removeDc85Item(item.id)} className="ml-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <button onClick={addDc85Item} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                            <PlusCircleIcon className="w-5 h-5 mr-2" /> Adicionar campo
                        </button>
                    </Section>
                </div>

                <div>
                    <Section title="Voluntários">
                        <ul className="space-y-3">
                            {state.volunteers.map(vol => {
                                const statusColor = {
                                    [VolunteerStatus.CONFIRMED]: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
                                    [VolunteerStatus.DECLINED]: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
                                    [VolunteerStatus.PENDING]: 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300',
                                }[vol.status];
                                return (
                                <li key={vol.id} className={`flex items-center group p-2 rounded-md ${statusColor}`}>
                                    <div className="flex-grow"><EditableField value={vol.name} onSave={(v) => handleVolunteerChange(vol.id, v)} /></div>
                                    <div className="flex items-center space-x-1 ml-2">
                                        <button onClick={() => handleVolunteerStatus(vol.id, VolunteerStatus.CONFIRMED)} className={`p-1 rounded-full ${vol.status === VolunteerStatus.CONFIRMED ? 'bg-green-500 text-white' : 'hover:bg-green-200 dark:hover:bg-green-700'}`}><UserCheckIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleVolunteerStatus(vol.id, VolunteerStatus.DECLINED)} className={`p-1 rounded-full ${vol.status === VolunteerStatus.DECLINED ? 'bg-red-500 text-white' : 'hover:bg-red-200 dark:hover:bg-red-700'}`}><UserXIcon className="w-5 h-5"/></button>
                                        <button onClick={() => removeVolunteer(vol.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </li>
                            )})}
                        </ul>
                         <button onClick={addVolunteer} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                            <PlusCircleIcon className="w-5 h-5 mr-2" /> Adicionar voluntário
                        </button>
                    </Section>
                    
                    <Section title="Documentos Necessários">
                        <ul className="space-y-2">
                            {state.documents.map(doc => (
                                <li key={doc.id} className="flex items-center group text-sm bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                                    <span className="flex-grow">{doc.name}</span>
                                    <button onClick={() => removeDocument(doc.id)} className="ml-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="mt-4 text-blue-600 dark:text-blue-400 hover:underline flex items-center">
                            <PlusCircleIcon className="w-5 h-5 mr-2" /> Anexar arquivos
                        </button>
                    </Section>

                    <Section title="Equipamentos de Proteção Individual (EPIs) Obrigatórios">
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
                           {state.episRequired.map((epi, index) => <li key={index}>{epi}</li>)}
                        </ol>
                    </Section>
                </div>
            </main>
        </div>
    );
};

export default App;