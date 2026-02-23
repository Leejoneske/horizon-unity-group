import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, X, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

interface MemberNote {
  id: string;
  user_id: string;
  note: string;
  created_at: string;
  profile_name?: string;
}

interface MemberNotesProps {
  member: any;
  adminId: string;
  onRefresh: () => void;
}

export default function MemberNotesDialog({ member, adminId, onRefresh }: MemberNotesProps) {
  const [notes, setNotes] = useState<MemberNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a note',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('member_notes')
        .insert({
          user_id: member.user_id,
          admin_id: adminId,
          note: newNote
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note added'
      });

      setNewNote('');
      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add note';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return;

    try {
      const { error } = await supabase
        .from('member_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Note deleted'
      });

      onRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900">Private Notes</h4>

      {/* Add Note */}
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
          disabled={isLoading || !newNote.trim()}
          className="w-full py-2 px-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {/* Notes List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-gray-700">{ note.note}</p>
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
