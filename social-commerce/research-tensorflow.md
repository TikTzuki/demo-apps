⏺ TensorFlow ResNet and TensorFlow Serving are two different components:

TensorFlow ResNet

ResNet (Residual Network) is a deep convolutional neural network architecture designed for image classification. It
introduced "skip connections" that allow gradients to flow through the network more easily, enabling training of very
deep networks (50, 101, 152+ layers).

Use cases:

- Image classification
- Feature extraction backbone for other tasks
- Transfer learning base model

Not ideal for pose sequence recognition - ResNet processes single images, not temporal sequences.

TensorFlow Serving

TensorFlow Serving is a production deployment system for serving ML models via REST/gRPC APIs. It handles:

- Model versioning and hot-swapping
- Batching requests for efficiency
- High-performance inference

It's the deployment layer, not the model itself.

For Pose Sequence Recognition ("hands up")

You need a temporal model that understands sequences. Better
approaches:                                                                                                                                                                                                                                         
┌────────────────────┬───────────────────────────────────────────────────────────────────────────────────────────────────────┐                                                                                                                                                                                   
│ Approach │ Description
│                                                                                                                                                                                   
├────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤                                                                                                                                                                                   
│ LSTM/GRU │ Recurrent networks for sequence modeling
│                                                                                                                                                                                   
├────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤                                                                                                                                                                                   
│ Temporal CNN (TCN) │ 1D convolutions over time
│                                                                                                                                                                                   
├────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤                                                                                                                                                                                   
│ Transformer │ Attention-based sequence modeling
│                                                                                                                                                                                   
├────────────────────┼───────────────────────────────────────────────────────────────────────────────────────────────────────┤                                                                                                                                                                                   
│ ST-GCN │ Spatial-Temporal Graph Convolutional Network (state-of-the-art for skeleton-based action recognition)
│                                                                                                                                                                                   
└────────────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────────┘                                                                                                                                                                                   
Recommended Pipeline

Video → Pose Estimation (MediaPipe/OpenPose) → Pose Sequences → Temporal Model → Action Class

Libraries to consider:

- MediaPipe - Real-time pose detection (gives you skeleton keypoints)
- MMAction2 - Action recognition framework
- PoseC3D - Skeleton-based action recognition

Would you like me to explore specific implementations for pose-based gesture recognition? 