import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface MemberNote {
  id: string;
  note: string;
  created_at: string;
}

interface MemberNotesProps {
  member: { user_id: string; full_name: string };
  adminId: string;
  onRefresh: () => void;
}

// Notes are stored locally since there's no member_notes table
export default function MemberNotesDialog({ member, adminId, onRefresh }: MemberNotesProps) {
  const [notes, setNotes] = useState<MemberNote[]>(() => {
    const stored = localStorage.getItem(`member_notes_${member.user_id}`);
    return stored ? JSON.parse(stored) : [];
  });
  const [newNote, setNewNote] = useState('');

  const saveNotes = (updated: MemberNote[]) => {
    setNotes(updated);
    localStorage.setItem(`member_notes_${member.user_id}`, JSON.stringify(updated));
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: MemberNote = {
      id: crypto.randomUUID(),
      note: newNote,
      created_at: new Date().toISOString(),
    };
    saveNotes([note, ...notes]);
    setNewNote('');
  };

  const handleDeleteNote = (noteId: string) => {
    saveNotes(notes.filter(n => n.id !== noteId));
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Private Notes</h4>
      <div className="space-y-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a private note about this member..."
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
          rows={3}
        />
        <button
          onClick={handleAddNote}
          disabled={!newNote.trim()}
          className="w-full py-2 px-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">{note.note}</p>
              <button
                onClick={() => handleDeleteNote(note.id)}
                className="mt-2 text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
