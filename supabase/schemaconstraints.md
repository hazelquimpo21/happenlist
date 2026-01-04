| table_schema        | table_name                 | constraint_type | column_name           |
| ------------------- | -------------------------- | --------------- | --------------------- |
| public              | admin_audit_log            | CHECK           | null                  |
| public              | admin_audit_log            | CHECK           | null                  |
| public              | admin_audit_log            | CHECK           | null                  |
| public              | admin_audit_log            | CHECK           | null                  |
| public              | admin_audit_log            | PRIMARY KEY     | id                    |
| auth                | audit_log_entries          | PRIMARY KEY     | id                    |
| auth                | audit_log_entries          | CHECK           | null                  |
| auth                | audit_log_entries          | CHECK           | null                  |
| storage             | buckets                    | CHECK           | null                  |
| storage             | buckets                    | PRIMARY KEY     | id                    |
| storage             | buckets                    | CHECK           | null                  |
| storage             | buckets                    | CHECK           | null                  |
| storage             | buckets_analytics          | CHECK           | null                  |
| storage             | buckets_analytics          | CHECK           | null                  |
| storage             | buckets_analytics          | PRIMARY KEY     | id                    |
| storage             | buckets_analytics          | CHECK           | null                  |
| storage             | buckets_analytics          | CHECK           | null                  |
| storage             | buckets_analytics          | CHECK           | null                  |
| storage             | buckets_analytics          | CHECK           | null                  |
| public              | categories                 | CHECK           | null                  |
| public              | categories                 | PRIMARY KEY     | id                    |
| public              | categories                 | UNIQUE          | slug                  |
| public              | categories                 | CHECK           | null                  |
| public              | categories                 | CHECK           | null                  |
| public              | event_drafts               | PRIMARY KEY     | id                    |
| public              | event_drafts               | CHECK           | null                  |
| public              | event_drafts               | CHECK           | null                  |
| public              | event_drafts               | CHECK           | null                  |
| public              | event_drafts               | CHECK           | null                  |
| public              | event_drafts               | FOREIGN KEY     | submitted_event_id    |
| public              | event_drafts               | FOREIGN KEY     | user_id               |
| public              | events                     | CHECK           | null                  |
| public              | events                     | CHECK           | null                  |
| public              | events                     | CHECK           | null                  |
| public              | events                     | CHECK           | null                  |
| public              | events                     | FOREIGN KEY     | organizer_id          |
| public              | events                     | FOREIGN KEY     | location_id           |
| public              | events                     | FOREIGN KEY     | category_id           |
| public              | events                     | FOREIGN KEY     | recurrence_parent_id  |
| public              | events                     | UNIQUE          | slug                  |
| public              | events                     | PRIMARY KEY     | id                    |
| public              | events                     | UNIQUE          | instance_date         |
| public              | events                     | CHECK           | null                  |
| auth                | flow_state                 | CHECK           | null                  |
| auth                | flow_state                 | PRIMARY KEY     | id                    |
| auth                | flow_state                 | CHECK           | null                  |
| auth                | flow_state                 | CHECK           | null                  |
| auth                | flow_state                 | CHECK           | null                  |
| auth                | flow_state                 | CHECK           | null                  |
| auth                | flow_state                 | CHECK           | null                  |
| public              | hearts                     | FOREIGN KEY     | user_id               |
| public              | hearts                     | UNIQUE          | event_id              |
| public              | hearts                     | CHECK           | null                  |
| public              | hearts                     | CHECK           | null                  |
| public              | hearts                     | CHECK           | null                  |
| public              | hearts                     | PRIMARY KEY     | id                    |
| public              | hearts                     | UNIQUE          | user_id               |
| public              | hearts                     | FOREIGN KEY     | event_id              |
| auth                | identities                 | PRIMARY KEY     | id                    |
| auth                | identities                 | FOREIGN KEY     | user_id               |
| auth                | identities                 | CHECK           | null                  |
| auth                | identities                 | CHECK           | null                  |
| auth                | identities                 | CHECK           | null                  |
| auth                | identities                 | CHECK           | null                  |
| auth                | identities                 | CHECK           | null                  |
| auth                | identities                 | UNIQUE          | provider_id           |
| auth                | identities                 | UNIQUE          | provider              |
| auth                | instances                  | CHECK           | null                  |
| auth                | instances                  | PRIMARY KEY     | id                    |
| public              | locations                  | CHECK           | null                  |
| public              | locations                  | UNIQUE          | slug                  |
| public              | locations                  | PRIMARY KEY     | id                    |
| public              | locations                  | CHECK           | null                  |
| public              | locations                  | CHECK           | null                  |
| public              | locations                  | CHECK           | null                  |
| realtime            | messages                   | PRIMARY KEY     | inserted_at           |
| realtime            | messages                   | CHECK           | null                  |
| realtime            | messages                   | CHECK           | null                  |
| realtime            | messages                   | PRIMARY KEY     | id                    |
| realtime            | messages                   | CHECK           | null                  |
| realtime            | messages                   | CHECK           | null                  |
| realtime            | messages                   | CHECK           | null                  |
| auth                | mfa_amr_claims             | UNIQUE          | authentication_method |
| auth                | mfa_amr_claims             | CHECK           | null                  |
| auth                | mfa_amr_claims             | CHECK           | null                  |
| auth                | mfa_amr_claims             | CHECK           | null                  |
| auth                | mfa_amr_claims             | CHECK           | null                  |
| auth                | mfa_amr_claims             | FOREIGN KEY     | session_id            |
| auth                | mfa_amr_claims             | UNIQUE          | session_id            |
| auth                | mfa_amr_claims             | CHECK           | null                  |
| auth                | mfa_amr_claims             | PRIMARY KEY     | id                    |
| auth                | mfa_challenges             | FOREIGN KEY     | factor_id             |
| auth                | mfa_challenges             | PRIMARY KEY     | id                    |
| auth                | mfa_challenges             | CHECK           | null                  |
| auth                | mfa_challenges             | CHECK           | null                  |
| auth                | mfa_challenges             | CHECK           | null                  |
| auth                | mfa_challenges             | CHECK           | null                  |
| auth                | mfa_factors                | CHECK           | null                  |
| auth                | mfa_factors                | PRIMARY KEY     | id                    |
| auth                | mfa_factors                | FOREIGN KEY     | user_id               |
| auth                | mfa_factors                | UNIQUE          | last_challenged_at    |
| auth                | mfa_factors                | CHECK           | null                  |
| auth                | mfa_factors                | CHECK           | null                  |
| auth                | mfa_factors                | CHECK           | null                  |
| auth                | mfa_factors                | CHECK           | null                  |
| auth                | mfa_factors                | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | FOREIGN KEY     | user_id               |
| auth                | oauth_authorizations       | FOREIGN KEY     | client_id             |
| auth                | oauth_authorizations       | UNIQUE          | authorization_code    |
| auth                | oauth_authorizations       | UNIQUE          | authorization_id      |
| auth                | oauth_authorizations       | PRIMARY KEY     | id                    |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_authorizations       | CHECK           | null                  |
| auth                | oauth_client_states        | PRIMARY KEY     | id                    |
| auth                | oauth_client_states        | CHECK           | null                  |
| auth                | oauth_client_states        | CHECK           | null                  |
| auth                | oauth_client_states        | CHECK           | null                  |
| auth                | oauth_clients              | CHECK           | null                  |
| auth                | oauth_clients              | CHECK           | null                  |
| auth                | oauth_clients              | CHECK           | null                  |
| auth                | oauth_clients              | CHECK           | null                  |
| auth                | oauth_clients              | CHECK           | null                  |
| auth                | oauth_clients              | CHECK           | null                  |
| auth                | oauth_clients              | CHECK           | null                  |
| auth                | oauth_clients              | CHECK           | null                  |
| auth                | oauth_clients              | PRIMARY KEY     | id                    |
| auth                | oauth_clients              | CHECK           | null                  |
| auth                | oauth_clients              | CHECK           | null                  |
| auth                | oauth_consents             | CHECK           | null                  |
| auth                | oauth_consents             | FOREIGN KEY     | client_id             |
| auth                | oauth_consents             | FOREIGN KEY     | user_id               |
| auth                | oauth_consents             | UNIQUE          | client_id             |
| auth                | oauth_consents             | UNIQUE          | user_id               |
| auth                | oauth_consents             | PRIMARY KEY     | id                    |
| auth                | oauth_consents             | CHECK           | null                  |
| auth                | oauth_consents             | CHECK           | null                  |
| auth                | oauth_consents             | CHECK           | null                  |
| auth                | oauth_consents             | CHECK           | null                  |
| auth                | oauth_consents             | CHECK           | null                  |
| auth                | oauth_consents             | CHECK           | null                  |
| auth                | oauth_consents             | CHECK           | null                  |
| storage             | objects                    | PRIMARY KEY     | id                    |
| storage             | objects                    | CHECK           | null                  |
| storage             | objects                    | FOREIGN KEY     | bucket_id             |
| auth                | one_time_tokens            | CHECK           | null                  |
| auth                | one_time_tokens            | CHECK           | null                  |
| auth                | one_time_tokens            | FOREIGN KEY     | user_id               |
| auth                | one_time_tokens            | CHECK           | null                  |
| auth                | one_time_tokens            | CHECK           | null                  |
| auth                | one_time_tokens            | CHECK           | null                  |
| auth                | one_time_tokens            | PRIMARY KEY     | id                    |
| auth                | one_time_tokens            | CHECK           | null                  |
| auth                | one_time_tokens            | CHECK           | null                  |
| auth                | one_time_tokens            | CHECK           | null                  |
| public              | organizer_claim_log        | CHECK           | null                  |
| public              | organizer_claim_log        | CHECK           | null                  |
| public              | organizer_claim_log        | CHECK           | null                  |
| public              | organizer_claim_log        | PRIMARY KEY     | id                    |
| public              | organizer_claim_log        | FOREIGN KEY     | organizer_id          |
| public              | organizer_claim_log        | FOREIGN KEY     | user_id               |
| public              | organizer_claim_log        | CHECK           | null                  |
| public              | organizer_claim_log        | CHECK           | null                  |
| public              | organizer_users            | FOREIGN KEY     | organizer_id          |
| public              | organizer_users            | UNIQUE          | user_id               |
| public              | organizer_users            | UNIQUE          | organizer_id          |
| public              | organizer_users            | PRIMARY KEY     | id                    |
| public              | organizer_users            | CHECK           | null                  |
| public              | organizer_users            | CHECK           | null                  |
| public              | organizer_users            | CHECK           | null                  |
| public              | organizer_users            | CHECK           | null                  |
| public              | organizer_users            | CHECK           | null                  |
| public              | organizer_users            | CHECK           | null                  |
| public              | organizer_users            | FOREIGN KEY     | user_id               |
| public              | organizers                 | UNIQUE          | slug                  |
| public              | organizers                 | CHECK           | null                  |
| public              | organizers                 | CHECK           | null                  |
| public              | organizers                 | FOREIGN KEY     | user_id               |
| public              | organizers                 | CHECK           | null                  |
| public              | organizers                 | PRIMARY KEY     | id                    |
| storage             | prefixes                   | CHECK           | null                  |
| storage             | prefixes                   | PRIMARY KEY     | name                  |
| storage             | prefixes                   | PRIMARY KEY     | level                 |
| storage             | prefixes                   | PRIMARY KEY     | bucket_id             |
| storage             | prefixes                   | CHECK           | null                  |
| storage             | prefixes                   | CHECK           | null                  |
| storage             | prefixes                   | FOREIGN KEY     | bucket_id             |
| public              | profiles                   | PRIMARY KEY     | id                    |
| public              | profiles                   | FOREIGN KEY     | id                    |
| public              | profiles                   | CHECK           | null                  |
| public              | profiles                   | CHECK           | null                  |
| auth                | refresh_tokens             | UNIQUE          | token                 |
| auth                | refresh_tokens             | CHECK           | null                  |
| auth                | refresh_tokens             | FOREIGN KEY     | session_id            |
| auth                | refresh_tokens             | PRIMARY KEY     | id                    |
| storage             | s3_multipart_uploads       | PRIMARY KEY     | id                    |
| storage             | s3_multipart_uploads       | CHECK           | null                  |
| storage             | s3_multipart_uploads       | FOREIGN KEY     | bucket_id             |
| storage             | s3_multipart_uploads       | CHECK           | null                  |
| storage             | s3_multipart_uploads       | CHECK           | null                  |
| storage             | s3_multipart_uploads       | CHECK           | null                  |
| storage             | s3_multipart_uploads       | CHECK           | null                  |
| storage             | s3_multipart_uploads       | CHECK           | null                  |
| storage             | s3_multipart_uploads       | CHECK           | null                  |
| storage             | s3_multipart_uploads_parts | CHECK           | null                  |
| storage             | s3_multipart_uploads_parts | FOREIGN KEY     | bucket_id             |
| storage             | s3_multipart_uploads_parts | FOREIGN KEY     | upload_id             |
| storage             | s3_multipart_uploads_parts | PRIMARY KEY     | id                    |
| storage             | s3_multipart_uploads_parts | CHECK           | null                  |
| storage             | s3_multipart_uploads_parts | CHECK           | null                  |
| storage             | s3_multipart_uploads_parts | CHECK           | null                  |
| storage             | s3_multipart_uploads_parts | CHECK           | null                  |
| storage             | s3_multipart_uploads_parts | CHECK           | null                  |
| storage             | s3_multipart_uploads_parts | CHECK           | null                  |
| storage             | s3_multipart_uploads_parts | CHECK           | null                  |
| storage             | s3_multipart_uploads_parts | CHECK           | null                  |
| auth                | saml_providers             | CHECK           | null                  |
| auth                | saml_providers             | FOREIGN KEY     | sso_provider_id       |
| auth                | saml_providers             | UNIQUE          | entity_id             |
| auth                | saml_providers             | PRIMARY KEY     | id                    |
| auth                | saml_providers             | CHECK           | null                  |
| auth                | saml_providers             | CHECK           | null                  |
| auth                | saml_providers             | CHECK           | null                  |
| auth                | saml_providers             | CHECK           | null                  |
| auth                | saml_providers             | CHECK           | null                  |
| auth                | saml_providers             | CHECK           | null                  |
| auth                | saml_relay_states          | CHECK           | null                  |
| auth                | saml_relay_states          | FOREIGN KEY     | sso_provider_id       |
| auth                | saml_relay_states          | CHECK           | null                  |
| auth                | saml_relay_states          | CHECK           | null                  |
| auth                | saml_relay_states          | FOREIGN KEY     | flow_state_id         |
| auth                | saml_relay_states          | PRIMARY KEY     | id                    |
| auth                | saml_relay_states          | CHECK           | null                  |
| supabase_migrations | schema_migrations          | CHECK           | null                  |
| realtime            | schema_migrations          | CHECK           | null                  |
| supabase_migrations | schema_migrations          | PRIMARY KEY     | version               |
| realtime            | schema_migrations          | PRIMARY KEY     | version               |
| realtime            | schema_migrations          | PRIMARY KEY     | version               |
| supabase_migrations | schema_migrations          | PRIMARY KEY     | version               |
| supabase_migrations | schema_migrations          | PRIMARY KEY     | version               |
| realtime            | schema_migrations          | PRIMARY KEY     | version               |
| supabase_migrations | schema_migrations          | UNIQUE          | idempotency_key       |
| vault               | secrets                    | CHECK           | null                  |
| vault               | secrets                    | CHECK           | null                  |
| vault               | secrets                    | CHECK           | null                  |
| vault               | secrets                    | CHECK           | null                  |
| vault               | secrets                    | CHECK           | null                  |
| vault               | secrets                    | PRIMARY KEY     | id                    |
| public              | series                     | FOREIGN KEY     | location_id           |
| public              | series                     | CHECK           | null                  |
| public              | series                     | CHECK           | null                  |
| public              | series                     | CHECK           | null                  |
| public              | series                     | PRIMARY KEY     | id                    |
| public              | series                     | UNIQUE          | slug                  |
| public              | series                     | FOREIGN KEY     | organizer_id          |
| public              | series                     | FOREIGN KEY     | category_id           |
| public              | series                     | CHECK           | null                  |
| auth                | sessions                   | FOREIGN KEY     | user_id               |
| auth                | sessions                   | FOREIGN KEY     | oauth_client_id       |
| auth                | sessions                   | PRIMARY KEY     | id                    |
| auth                | sessions                   | CHECK           | null                  |
| auth                | sessions                   | CHECK           | null                  |
| auth                | sessions                   | CHECK           | null                  |
| auth                | sso_domains                | CHECK           | null                  |
| auth                | sso_domains                | PRIMARY KEY     | id                    |
| auth                | sso_domains                | FOREIGN KEY     | sso_provider_id       |
| auth                | sso_domains                | CHECK           | null                  |
| auth                | sso_domains                | CHECK           | null                  |
| auth                | sso_domains                | CHECK           | null                  |
| auth                | sso_providers              | CHECK           | null                  |
| auth                | sso_providers              | CHECK           | null                  |
| auth                | sso_providers              | PRIMARY KEY     | id                    |
| realtime            | subscription               | CHECK           | null                  |
| realtime            | subscription               | CHECK           | null                  |
| realtime            | subscription               | CHECK           | null                  |
| realtime            | subscription               | CHECK           | null                  |
| realtime            | subscription               | PRIMARY KEY     | id                    |
| realtime            | subscription               | CHECK           | null                  |
| realtime            | subscription               | CHECK           | null                  |
| realtime            | subscription               | CHECK           | null                  |
| public              | user_follows               | PRIMARY KEY     | id                    |
| public              | user_follows               | UNIQUE          | user_id               |
| public              | user_follows               | FOREIGN KEY     | category_id           |
| public              | user_follows               | FOREIGN KEY     | venue_id              |
| public              | user_follows               | FOREIGN KEY     | organizer_id          |
| public              | user_follows               | UNIQUE          | category_id           |
| public              | user_follows               | FOREIGN KEY     | user_id               |
| public              | user_follows               | UNIQUE          | user_id               |
| public              | user_follows               | UNIQUE          | venue_id              |
| public              | user_follows               | CHECK           | null                  |
| public              | user_follows               | CHECK           | null                  |
| public              | user_follows               | UNIQUE          | user_id               |
| public              | user_follows               | UNIQUE          | organizer_id          |
| public              | user_follows               | CHECK           | null                  |
| public              | user_roles                 | CHECK           | null                  |
| public              | user_roles                 | CHECK           | null                  |
| public              | user_roles                 | CHECK           | null                  |
| public              | user_roles                 | CHECK           | null                  |
| public              | user_roles                 | UNIQUE          | role                  |
| public              | user_roles                 | UNIQUE          | user_email            |
| public              | user_roles                 | PRIMARY KEY     | id                    |
| auth                | users                      | CHECK           | null                  |
| auth                | users                      | CHECK           | null                  |
| auth                | users                      | CHECK           | null                  |
| auth                | users                      | PRIMARY KEY     | id                    |
| auth                | users                      | UNIQUE          | phone                 |
| auth                | users                      | CHECK           | null                  |