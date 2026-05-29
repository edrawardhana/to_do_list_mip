<?php

namespace App\Mail;

use App\Models\Exception as InternException;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SuratIzinRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $exception;
    public $user;
    public $rejectedBy;

    /**
     * Create a new message instance.
     */
    public function __construct(InternException $exception, $user, $rejectedBy)
    {
        $this->exception  = $exception;
        $this->user       = $user;
        $this->rejectedBy = $rejectedBy;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Surat Izin Magang Ditolak - ' . $this->user->full_name,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.surat_izin_rejected',
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}
