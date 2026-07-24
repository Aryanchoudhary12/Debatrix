type TrackHandler = (stream: MediaStream) => void;
type IceCandidateHandler = (candidate: RTCIceCandidate) => void;
type NegotiationHandler = (offer: RTCSessionDescriptionInit) => void;

class PeerService {
  private peer: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private onTrackHandler: TrackHandler | null = null;
  private onIceCandidateHandler: IceCandidateHandler | null = null;
  private onNegotiationNeededHandler: NegotiationHandler | null = null;
  private negotiating = false;
  private isCaller = false;
  private pendingCandidates: RTCIceCandidateInit[] = [];
  private remoteDescriptionSet = false;
  hasConnection() {
    return this.remoteDescriptionSet;
  }
  private createPeer() {
    if (typeof window === "undefined") return null;
    if (!this.peer) {
      this.peer = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      this.peer.ontrack = (event) => {
        this.onTrackHandler?.(event.streams[0]);
      };
      this.peer.onicecandidate = (event) => {
        if (event.candidate) this.onIceCandidateHandler?.(event.candidate);
      };
      this.peer.onnegotiationneeded = async () => {
        if (!this.isCaller || this.negotiating || !this.peer) return;
        try {
          this.negotiating = true;
          const offer = await this.peer.createOffer();
          await this.peer.setLocalDescription(offer);
          this.onNegotiationNeededHandler?.(offer);
        } catch (err) {
          console.error("Renegotiation failed:", err);
        } finally {
          this.negotiating = false;
        }
      };
    }
    return this.peer;
  }

  setRole(isCaller: boolean) {
    this.isCaller = isCaller;
  }

  onTrack(handler: TrackHandler) {
    this.onTrackHandler = handler;
  }
  onIceCandidate(handler: IceCandidateHandler) {
    this.onIceCandidateHandler = handler;
  }
  onNegotiationNeeded(handler: NegotiationHandler) {
    this.onNegotiationNeededHandler = handler;
  }

  setLocalStream(stream: MediaStream) {
    const peer = this.createPeer();
    if (!peer) return;
    this.localStream = stream;
    const existing = peer.getSenders().map((s) => s.track);
    stream.getTracks().forEach((track) => {
      if (!existing.includes(track)) peer.addTrack(track, stream);
    });
  }

  toggleTrack(kind: "video" | "audio", enabled: boolean) {
    this.localStream
      ?.getTracks()
      .filter((t) => t.kind === kind)
      .forEach((t) => {
        t.enabled = enabled;
      });
  }

  async getOffer() {
    const peer = this.createPeer();
    if (!peer) return;
    this.isCaller = true;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    return offer;
  }

  async getAnswer(offer: RTCSessionDescriptionInit) {
    const peer = this.createPeer();
    if (!peer) return;
    this.isCaller = false;
    await peer.setRemoteDescription(new RTCSessionDescription(offer));
    this.remoteDescriptionSet = true;
    await this.flushPendingCandidates();
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    return answer;
  }

  async setRemoteAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peer) return;
    await this.peer.setRemoteDescription(new RTCSessionDescription(answer));
    this.remoteDescriptionSet = true;
    await this.flushPendingCandidates();
  }

  async getRenegotiationAnswer(offer: RTCSessionDescriptionInit) {
    if (!this.peer) return;
    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    return answer;
  }

  private async flushPendingCandidates() {
    for (const candidate of this.pendingCandidates) {
      try {
        await this.peer!.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Error flushing queued ICE candidate:", err);
      }
    }
    this.pendingCandidates = [];
  }

  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peer || !this.remoteDescriptionSet) {
      this.pendingCandidates.push(candidate);
      return;
    }
    try {
      await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error("Error adding ICE candidate:", err);
    }
  }

  closeConnection() {
    this.peer?.close();
    this.peer = null;
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    this.pendingCandidates = [];
    this.remoteDescriptionSet = false;
    this.isCaller = false;
    this.negotiating = false;
  }
}

export default new PeerService();
