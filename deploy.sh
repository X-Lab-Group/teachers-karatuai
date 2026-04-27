#!/bin/bash
set -e

PROJECT_ID="dolly-party-hrms"
REGION="us-central1"
BUCKET_NAME="karatuai-models"
SERVICE_NAME="karatuai-teachers-companion"

echo "Setting GCP project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

echo "Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable storage.googleapis.com

echo "Creating GCS bucket for AI model..."
gsutil mb -p $PROJECT_ID -l $REGION gs://$BUCKET_NAME || echo "Bucket already exists"

echo "Applying CORS configuration..."
gsutil cors set cors.json gs://$BUCKET_NAME

echo "Making bucket publicly readable..."
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

echo "Submitting Cloud Build..."
# Forward the classroom-form endpoint into the Cloud Build substitution so
# the Vite bundle is rebuilt with VITE_CLASSROOM_FORM_ENDPOINT baked in.
# Set the variable in your shell (or a .env you source) before running this
# script — leaving it unset is fine, it just disables the form submission.
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_VITE_CLASSROOM_FORM_ENDPOINT="${VITE_CLASSROOM_FORM_ENDPOINT:-}"

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo ""
echo "Next step: Upload the Gemma model to GCS"
echo "1. Download model: curl -L -o gemma-4-E2B-it-web.task 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it-web.task'"
echo "2. Upload to GCS: gsutil cp gemma-4-E2B-it-web.task gs://$BUCKET_NAME/"
echo ""
echo "Model URL will be: https://storage.googleapis.com/$BUCKET_NAME/gemma-4-E2B-it-web.task"
