| table_schema        | table_name                  | column_name                  | data_type                   | is_nullable | column_default                                  |
| ------------------- | --------------------------- | ---------------------------- | --------------------------- | ----------- | ----------------------------------------------- |
| auth                | audit_log_entries           | instance_id                  | uuid                        | YES         | null                                            |
| auth                | audit_log_entries           | id                           | uuid                        | NO          | null                                            |
| auth                | audit_log_entries           | payload                      | json                        | YES         | null                                            |
| auth                | audit_log_entries           | created_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | audit_log_entries           | ip_address                   | character varying           | NO          | ''::character varying                           |
| auth                | flow_state                  | id                           | uuid                        | NO          | null                                            |
| auth                | flow_state                  | user_id                      | uuid                        | YES         | null                                            |
| auth                | flow_state                  | auth_code                    | text                        | NO          | null                                            |
| auth                | flow_state                  | code_challenge_method        | USER-DEFINED                | NO          | null                                            |
| auth                | flow_state                  | code_challenge               | text                        | NO          | null                                            |
| auth                | flow_state                  | provider_type                | text                        | NO          | null                                            |
| auth                | flow_state                  | provider_access_token        | text                        | YES         | null                                            |
| auth                | flow_state                  | provider_refresh_token       | text                        | YES         | null                                            |
| auth                | flow_state                  | created_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | flow_state                  | updated_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | flow_state                  | authentication_method        | text                        | NO          | null                                            |
| auth                | flow_state                  | auth_code_issued_at          | timestamp with time zone    | YES         | null                                            |
| auth                | identities                  | provider_id                  | text                        | NO          | null                                            |
| auth                | identities                  | user_id                      | uuid                        | NO          | null                                            |
| auth                | identities                  | identity_data                | jsonb                       | NO          | null                                            |
| auth                | identities                  | provider                     | text                        | NO          | null                                            |
| auth                | identities                  | last_sign_in_at              | timestamp with time zone    | YES         | null                                            |
| auth                | identities                  | created_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | identities                  | updated_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | identities                  | email                        | text                        | YES         | null                                            |
| auth                | identities                  | id                           | uuid                        | NO          | gen_random_uuid()                               |
| auth                | instances                   | id                           | uuid                        | NO          | null                                            |
| auth                | instances                   | uuid                         | uuid                        | YES         | null                                            |
| auth                | instances                   | raw_base_config              | text                        | YES         | null                                            |
| auth                | instances                   | created_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | instances                   | updated_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | mfa_amr_claims              | session_id                   | uuid                        | NO          | null                                            |
| auth                | mfa_amr_claims              | created_at                   | timestamp with time zone    | NO          | null                                            |
| auth                | mfa_amr_claims              | updated_at                   | timestamp with time zone    | NO          | null                                            |
| auth                | mfa_amr_claims              | authentication_method        | text                        | NO          | null                                            |
| auth                | mfa_amr_claims              | id                           | uuid                        | NO          | null                                            |
| auth                | mfa_challenges              | id                           | uuid                        | NO          | null                                            |
| auth                | mfa_challenges              | factor_id                    | uuid                        | NO          | null                                            |
| auth                | mfa_challenges              | created_at                   | timestamp with time zone    | NO          | null                                            |
| auth                | mfa_challenges              | verified_at                  | timestamp with time zone    | YES         | null                                            |
| auth                | mfa_challenges              | ip_address                   | inet                        | NO          | null                                            |
| auth                | mfa_challenges              | otp_code                     | text                        | YES         | null                                            |
| auth                | mfa_challenges              | web_authn_session_data       | jsonb                       | YES         | null                                            |
| auth                | mfa_factors                 | id                           | uuid                        | NO          | null                                            |
| auth                | mfa_factors                 | user_id                      | uuid                        | NO          | null                                            |
| auth                | mfa_factors                 | friendly_name                | text                        | YES         | null                                            |
| auth                | mfa_factors                 | factor_type                  | USER-DEFINED                | NO          | null                                            |
| auth                | mfa_factors                 | status                       | USER-DEFINED                | NO          | null                                            |
| auth                | mfa_factors                 | created_at                   | timestamp with time zone    | NO          | null                                            |
| auth                | mfa_factors                 | updated_at                   | timestamp with time zone    | NO          | null                                            |
| auth                | mfa_factors                 | secret                       | text                        | YES         | null                                            |
| auth                | mfa_factors                 | phone                        | text                        | YES         | null                                            |
| auth                | mfa_factors                 | last_challenged_at           | timestamp with time zone    | YES         | null                                            |
| auth                | mfa_factors                 | web_authn_credential         | jsonb                       | YES         | null                                            |
| auth                | mfa_factors                 | web_authn_aaguid             | uuid                        | YES         | null                                            |
| auth                | mfa_factors                 | last_webauthn_challenge_data | jsonb                       | YES         | null                                            |
| auth                | oauth_authorizations        | id                           | uuid                        | NO          | null                                            |
| auth                | oauth_authorizations        | authorization_id             | text                        | NO          | null                                            |
| auth                | oauth_authorizations        | client_id                    | uuid                        | NO          | null                                            |
| auth                | oauth_authorizations        | user_id                      | uuid                        | YES         | null                                            |
| auth                | oauth_authorizations        | redirect_uri                 | text                        | NO          | null                                            |
| auth                | oauth_authorizations        | scope                        | text                        | NO          | null                                            |
| auth                | oauth_authorizations        | state                        | text                        | YES         | null                                            |
| auth                | oauth_authorizations        | resource                     | text                        | YES         | null                                            |
| auth                | oauth_authorizations        | code_challenge               | text                        | YES         | null                                            |
| auth                | oauth_authorizations        | code_challenge_method        | USER-DEFINED                | YES         | null                                            |
| auth                | oauth_authorizations        | response_type                | USER-DEFINED                | NO          | 'code'::auth.oauth_response_type                |
| auth                | oauth_authorizations        | status                       | USER-DEFINED                | NO          | 'pending'::auth.oauth_authorization_status      |
| auth                | oauth_authorizations        | authorization_code           | text                        | YES         | null                                            |
| auth                | oauth_authorizations        | created_at                   | timestamp with time zone    | NO          | now()                                           |
| auth                | oauth_authorizations        | expires_at                   | timestamp with time zone    | NO          | (now() + '00:03:00'::interval)                  |
| auth                | oauth_authorizations        | approved_at                  | timestamp with time zone    | YES         | null                                            |
| auth                | oauth_authorizations        | nonce                        | text                        | YES         | null                                            |
| auth                | oauth_client_states         | id                           | uuid                        | NO          | null                                            |
| auth                | oauth_client_states         | provider_type                | text                        | NO          | null                                            |
| auth                | oauth_client_states         | code_verifier                | text                        | YES         | null                                            |
| auth                | oauth_client_states         | created_at                   | timestamp with time zone    | NO          | null                                            |
| auth                | oauth_clients               | id                           | uuid                        | NO          | null                                            |
| auth                | oauth_clients               | client_secret_hash           | text                        | YES         | null                                            |
| auth                | oauth_clients               | registration_type            | USER-DEFINED                | NO          | null                                            |
| auth                | oauth_clients               | redirect_uris                | text                        | NO          | null                                            |
| auth                | oauth_clients               | grant_types                  | text                        | NO          | null                                            |
| auth                | oauth_clients               | client_name                  | text                        | YES         | null                                            |
| auth                | oauth_clients               | client_uri                   | text                        | YES         | null                                            |
| auth                | oauth_clients               | logo_uri                     | text                        | YES         | null                                            |
| auth                | oauth_clients               | created_at                   | timestamp with time zone    | NO          | now()                                           |
| auth                | oauth_clients               | updated_at                   | timestamp with time zone    | NO          | now()                                           |
| auth                | oauth_clients               | deleted_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | oauth_clients               | client_type                  | USER-DEFINED                | NO          | 'confidential'::auth.oauth_client_type          |
| auth                | oauth_consents              | id                           | uuid                        | NO          | null                                            |
| auth                | oauth_consents              | user_id                      | uuid                        | NO          | null                                            |
| auth                | oauth_consents              | client_id                    | uuid                        | NO          | null                                            |
| auth                | oauth_consents              | scopes                       | text                        | NO          | null                                            |
| auth                | oauth_consents              | granted_at                   | timestamp with time zone    | NO          | now()                                           |
| auth                | oauth_consents              | revoked_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | one_time_tokens             | id                           | uuid                        | NO          | null                                            |
| auth                | one_time_tokens             | user_id                      | uuid                        | NO          | null                                            |
| auth                | one_time_tokens             | token_type                   | USER-DEFINED                | NO          | null                                            |
| auth                | one_time_tokens             | token_hash                   | text                        | NO          | null                                            |
| auth                | one_time_tokens             | relates_to                   | text                        | NO          | null                                            |
| auth                | one_time_tokens             | created_at                   | timestamp without time zone | NO          | now()                                           |
| auth                | one_time_tokens             | updated_at                   | timestamp without time zone | NO          | now()                                           |
| auth                | refresh_tokens              | instance_id                  | uuid                        | YES         | null                                            |
| auth                | refresh_tokens              | id                           | bigint                      | NO          | nextval('auth.refresh_tokens_id_seq'::regclass) |
| auth                | refresh_tokens              | token                        | character varying           | YES         | null                                            |
| auth                | refresh_tokens              | user_id                      | character varying           | YES         | null                                            |
| auth                | refresh_tokens              | revoked                      | boolean                     | YES         | null                                            |
| auth                | refresh_tokens              | created_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | refresh_tokens              | updated_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | refresh_tokens              | parent                       | character varying           | YES         | null                                            |
| auth                | refresh_tokens              | session_id                   | uuid                        | YES         | null                                            |
| auth                | saml_providers              | id                           | uuid                        | NO          | null                                            |
| auth                | saml_providers              | sso_provider_id              | uuid                        | NO          | null                                            |
| auth                | saml_providers              | entity_id                    | text                        | NO          | null                                            |
| auth                | saml_providers              | metadata_xml                 | text                        | NO          | null                                            |
| auth                | saml_providers              | metadata_url                 | text                        | YES         | null                                            |
| auth                | saml_providers              | attribute_mapping            | jsonb                       | YES         | null                                            |
| auth                | saml_providers              | created_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | saml_providers              | updated_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | saml_providers              | name_id_format               | text                        | YES         | null                                            |
| auth                | saml_relay_states           | id                           | uuid                        | NO          | null                                            |
| auth                | saml_relay_states           | sso_provider_id              | uuid                        | NO          | null                                            |
| auth                | saml_relay_states           | request_id                   | text                        | NO          | null                                            |
| auth                | saml_relay_states           | for_email                    | text                        | YES         | null                                            |
| auth                | saml_relay_states           | redirect_to                  | text                        | YES         | null                                            |
| auth                | saml_relay_states           | created_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | saml_relay_states           | updated_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | saml_relay_states           | flow_state_id                | uuid                        | YES         | null                                            |
| auth                | schema_migrations           | version                      | character varying           | NO          | null                                            |
| auth                | sessions                    | id                           | uuid                        | NO          | null                                            |
| auth                | sessions                    | user_id                      | uuid                        | NO          | null                                            |
| auth                | sessions                    | created_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | sessions                    | updated_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | sessions                    | factor_id                    | uuid                        | YES         | null                                            |
| auth                | sessions                    | aal                          | USER-DEFINED                | YES         | null                                            |
| auth                | sessions                    | not_after                    | timestamp with time zone    | YES         | null                                            |
| auth                | sessions                    | refreshed_at                 | timestamp without time zone | YES         | null                                            |
| auth                | sessions                    | user_agent                   | text                        | YES         | null                                            |
| auth                | sessions                    | ip                           | inet                        | YES         | null                                            |
| auth                | sessions                    | tag                          | text                        | YES         | null                                            |
| auth                | sessions                    | oauth_client_id              | uuid                        | YES         | null                                            |
| auth                | sessions                    | refresh_token_hmac_key       | text                        | YES         | null                                            |
| auth                | sessions                    | refresh_token_counter        | bigint                      | YES         | null                                            |
| auth                | sessions                    | scopes                       | text                        | YES         | null                                            |
| auth                | sso_domains                 | id                           | uuid                        | NO          | null                                            |
| auth                | sso_domains                 | sso_provider_id              | uuid                        | NO          | null                                            |
| auth                | sso_domains                 | domain                       | text                        | NO          | null                                            |
| auth                | sso_domains                 | created_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | sso_domains                 | updated_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | sso_providers               | id                           | uuid                        | NO          | null                                            |
| auth                | sso_providers               | resource_id                  | text                        | YES         | null                                            |
| auth                | sso_providers               | created_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | sso_providers               | updated_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | sso_providers               | disabled                     | boolean                     | YES         | null                                            |
| auth                | users                       | instance_id                  | uuid                        | YES         | null                                            |
| auth                | users                       | id                           | uuid                        | NO          | null                                            |
| auth                | users                       | aud                          | character varying           | YES         | null                                            |
| auth                | users                       | role                         | character varying           | YES         | null                                            |
| auth                | users                       | email                        | character varying           | YES         | null                                            |
| auth                | users                       | encrypted_password           | character varying           | YES         | null                                            |
| auth                | users                       | email_confirmed_at           | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | invited_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | confirmation_token           | character varying           | YES         | null                                            |
| auth                | users                       | confirmation_sent_at         | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | recovery_token               | character varying           | YES         | null                                            |
| auth                | users                       | recovery_sent_at             | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | email_change_token_new       | character varying           | YES         | null                                            |
| auth                | users                       | email_change                 | character varying           | YES         | null                                            |
| auth                | users                       | email_change_sent_at         | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | last_sign_in_at              | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | raw_app_meta_data            | jsonb                       | YES         | null                                            |
| auth                | users                       | raw_user_meta_data           | jsonb                       | YES         | null                                            |
| auth                | users                       | is_super_admin               | boolean                     | YES         | null                                            |
| auth                | users                       | created_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | updated_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | phone                        | text                        | YES         | NULL::character varying                         |
| auth                | users                       | phone_confirmed_at           | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | phone_change                 | text                        | YES         | ''::character varying                           |
| auth                | users                       | phone_change_token           | character varying           | YES         | ''::character varying                           |
| auth                | users                       | phone_change_sent_at         | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | confirmed_at                 | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | email_change_token_current   | character varying           | YES         | ''::character varying                           |
| auth                | users                       | email_change_confirm_status  | smallint                    | YES         | 0                                               |
| auth                | users                       | banned_until                 | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | reauthentication_token       | character varying           | YES         | ''::character varying                           |
| auth                | users                       | reauthentication_sent_at     | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | is_sso_user                  | boolean                     | NO          | false                                           |
| auth                | users                       | deleted_at                   | timestamp with time zone    | YES         | null                                            |
| auth                | users                       | is_anonymous                 | boolean                     | NO          | false                                           |
| extensions          | pg_stat_statements          | userid                       | oid                         | YES         | null                                            |
| extensions          | pg_stat_statements          | dbid                         | oid                         | YES         | null                                            |
| extensions          | pg_stat_statements          | toplevel                     | boolean                     | YES         | null                                            |
| extensions          | pg_stat_statements          | queryid                      | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | query                        | text                        | YES         | null                                            |
| extensions          | pg_stat_statements          | plans                        | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | total_plan_time              | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | min_plan_time                | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | max_plan_time                | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | mean_plan_time               | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | stddev_plan_time             | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | calls                        | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | total_exec_time              | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | min_exec_time                | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | max_exec_time                | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | mean_exec_time               | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | stddev_exec_time             | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | rows                         | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | shared_blks_hit              | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | shared_blks_read             | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | shared_blks_dirtied          | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | shared_blks_written          | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | local_blks_hit               | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | local_blks_read              | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | local_blks_dirtied           | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | local_blks_written           | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | temp_blks_read               | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | temp_blks_written            | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | shared_blk_read_time         | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | shared_blk_write_time        | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | local_blk_read_time          | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | local_blk_write_time         | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | temp_blk_read_time           | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | temp_blk_write_time          | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | wal_records                  | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | wal_fpi                      | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | wal_bytes                    | numeric                     | YES         | null                                            |
| extensions          | pg_stat_statements          | jit_functions                | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | jit_generation_time          | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | jit_inlining_count           | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | jit_inlining_time            | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | jit_optimization_count       | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | jit_optimization_time        | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | jit_emission_count           | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | jit_emission_time            | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | jit_deform_count             | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements          | jit_deform_time              | double precision            | YES         | null                                            |
| extensions          | pg_stat_statements          | stats_since                  | timestamp with time zone    | YES         | null                                            |
| extensions          | pg_stat_statements          | minmax_stats_since           | timestamp with time zone    | YES         | null                                            |
| extensions          | pg_stat_statements_info     | dealloc                      | bigint                      | YES         | null                                            |
| extensions          | pg_stat_statements_info     | stats_reset                  | timestamp with time zone    | YES         | null                                            |
| public              | admin_audit_log             | id                           | uuid                        | NO          | gen_random_uuid()                               |
| public              | admin_audit_log             | action                       | text                        | NO          | null                                            |
| public              | admin_audit_log             | entity_type                  | text                        | NO          | null                                            |
| public              | admin_audit_log             | entity_id                    | uuid                        | NO          | null                                            |
| public              | admin_audit_log             | admin_id                     | text                        | YES         | null                                            |
| public              | admin_audit_log             | admin_email                  | text                        | YES         | null                                            |
| public              | admin_audit_log             | changes                      | jsonb                       | YES         | null                                            |
| public              | admin_audit_log             | notes                        | text                        | YES         | null                                            |
| public              | admin_audit_log             | ip_address                   | text                        | YES         | null                                            |
| public              | admin_audit_log             | user_agent                   | text                        | YES         | null                                            |
| public              | admin_audit_log             | created_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | admin_event_stats           | pending_review_count         | bigint                      | YES         | null                                            |
| public              | admin_event_stats           | published_count              | bigint                      | YES         | null                                            |
| public              | admin_event_stats           | draft_count                  | bigint                      | YES         | null                                            |
| public              | admin_event_stats           | rejected_count               | bigint                      | YES         | null                                            |
| public              | admin_event_stats           | scraped_count                | bigint                      | YES         | null                                            |
| public              | admin_event_stats           | scraped_pending_count        | bigint                      | YES         | null                                            |
| public              | admin_event_stats           | scraped_last_24h             | bigint                      | YES         | null                                            |
| public              | admin_event_stats           | reviewed_last_24h            | bigint                      | YES         | null                                            |
| public              | admin_event_stats           | total_count                  | bigint                      | YES         | null                                            |
| public              | ai_image_generation_stats   | ai_generated_count           | bigint                      | YES         | null                                            |
| public              | ai_image_generation_stats   | scraped_count                | bigint                      | YES         | null                                            |
| public              | ai_image_generation_stats   | total_generation_cost        | numeric                     | YES         | null                                            |
| public              | ai_image_generation_stats   | avg_generation_cost          | numeric                     | YES         | null                                            |
| public              | categories                  | id                           | uuid                        | NO          | gen_random_uuid()                               |
| public              | categories                  | name                         | text                        | NO          | null                                            |
| public              | categories                  | slug                         | text                        | NO          | null                                            |
| public              | categories                  | description                  | text                        | YES         | null                                            |
| public              | categories                  | icon                         | text                        | YES         | null                                            |
| public              | categories                  | color                        | text                        | YES         | null                                            |
| public              | categories                  | sort_order                   | integer                     | YES         | 0                                               |
| public              | categories                  | is_active                    | boolean                     | YES         | true                                            |
| public              | categories                  | created_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | categories                  | updated_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | event_drafts                | id                           | uuid                        | NO          | gen_random_uuid()                               |
| public              | event_drafts                | user_id                      | uuid                        | NO          | null                                            |
| public              | event_drafts                | user_email                   | text                        | NO          | null                                            |
| public              | event_drafts                | user_name                    | text                        | YES         | null                                            |
| public              | event_drafts                | draft_data                   | jsonb                       | NO          | '{}'::jsonb                                     |
| public              | event_drafts                | current_step                 | integer                     | YES         | 1                                               |
| public              | event_drafts                | completed_steps              | ARRAY                       | YES         | ARRAY[]::integer[]                              |
| public              | event_drafts                | series_draft_data            | jsonb                       | YES         | null                                            |
| public              | event_drafts                | submitted_event_id           | uuid                        | YES         | null                                            |
| public              | event_drafts                | created_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | event_drafts                | updated_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | event_drafts                | expires_at                   | timestamp with time zone    | YES         | (now() + '30 days'::interval)                   |
| public              | events                      | id                           | uuid                        | NO          | gen_random_uuid()                               |
| public              | events                      | title                        | text                        | NO          | null                                            |
| public              | events                      | slug                         | text                        | NO          | null                                            |
| public              | events                      | description                  | text                        | YES         | null                                            |
| public              | events                      | short_description            | text                        | YES         | null                                            |
| public              | events                      | start_datetime               | timestamp with time zone    | NO          | null                                            |
| public              | events                      | end_datetime                 | timestamp with time zone    | YES         | null                                            |
| public              | events                      | instance_date                | date                        | NO          | null                                            |
| public              | events                      | on_sale_date                 | date                        | YES         | null                                            |
| public              | events                      | is_all_day                   | boolean                     | YES         | false                                           |
| public              | events                      | timezone                     | text                        | YES         | 'America/Chicago'::text                         |
| public              | events                      | event_type                   | text                        | YES         | 'single'::text                                  |
| public              | events                      | recurrence_parent_id         | uuid                        | YES         | null                                            |
| public              | events                      | is_recurrence_template       | boolean                     | YES         | false                                           |
| public              | events                      | recurrence_pattern           | jsonb                       | YES         | null                                            |
| public              | events                      | series_id                    | uuid                        | YES         | null                                            |
| public              | events                      | location_id                  | uuid                        | YES         | null                                            |
| public              | events                      | organizer_id                 | uuid                        | YES         | null                                            |
| public              | events                      | category_id                  | uuid                        | YES         | null                                            |
| public              | events                      | price_type                   | text                        | YES         | 'fixed'::text                                   |
| public              | events                      | price_low                    | numeric                     | YES         | null                                            |
| public              | events                      | price_high                   | numeric                     | YES         | null                                            |
| public              | events                      | price_details                | text                        | YES         | null                                            |
| public              | events                      | is_free                      | boolean                     | YES         | false                                           |
| public              | events                      | ticket_url                   | text                        | YES         | null                                            |
| public              | events                      | image_url                    | text                        | YES         | null                                            |
| public              | events                      | flyer_url                    | text                        | YES         | null                                            |
| public              | events                      | thumbnail_url                | text                        | YES         | null                                            |
| public              | events                      | meta_title                   | text                        | YES         | null                                            |
| public              | events                      | meta_description             | text                        | YES         | null                                            |
| public              | events                      | heart_count                  | integer                     | YES         | 0                                               |
| public              | events                      | view_count                   | integer                     | YES         | 0                                               |
| public              | events                      | status                       | text                        | YES         | 'draft'::text                                   |
| public              | events                      | is_featured                  | boolean                     | YES         | false                                           |
| public              | events                      | featured_order               | integer                     | YES         | null                                            |
| public              | events                      | created_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | events                      | updated_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | events                      | published_at                 | timestamp with time zone    | YES         | null                                            |
| public              | events                      | source                       | text                        | YES         | 'manual'::text                                  |
| public              | events                      | source_url                   | text                        | YES         | null                                            |
| public              | events                      | source_id                    | text                        | YES         | null                                            |
| public              | events                      | scraped_at                   | timestamp with time zone    | YES         | null                                            |
| public              | events                      | scraped_data                 | jsonb                       | YES         | null                                            |
| public              | events                      | reviewed_at                  | timestamp with time zone    | YES         | null                                            |
| public              | events                      | reviewed_by                  | text                        | YES         | null                                            |
| public              | events                      | review_notes                 | text                        | YES         | null                                            |
| public              | events                      | rejection_reason             | text                        | YES         | null                                            |
| public              | events                      | raw_image_url                | text                        | YES         | null                                            |
| public              | events                      | raw_thumbnail_url            | text                        | YES         | null                                            |
| public              | events                      | image_validated              | boolean                     | YES         | false                                           |
| public              | events                      | image_validated_at           | timestamp with time zone    | YES         | null                                            |
| public              | events                      | image_validation_notes       | text                        | YES         | null                                            |
| public              | events                      | image_hosted                 | boolean                     | YES         | false                                           |
| public              | events                      | image_storage_path           | text                        | YES         | null                                            |
| public              | events                      | thumbnail_hosted             | boolean                     | YES         | false                                           |
| public              | events                      | thumbnail_storage_path       | text                        | YES         | null                                            |
| public              | events                      | flyer_hosted                 | boolean                     | YES         | false                                           |
| public              | events                      | flyer_storage_path           | text                        | YES         | null                                            |
| public              | events                      | series_sequence              | integer                     | YES         | null                                            |
| public              | events                      | is_series_instance           | boolean                     | YES         | false                                           |
| public              | events                      | submitted_by_email           | text                        | YES         | null                                            |
| public              | events                      | submitted_by_name            | text                        | YES         | null                                            |
| public              | events                      | submitted_at                 | timestamp with time zone    | YES         | null                                            |
| public              | events                      | change_request_message       | text                        | YES         | null                                            |
| public              | events                      | deleted_at                   | timestamp with time zone    | YES         | null                                            |
| public              | events                      | deleted_by                   | text                        | YES         | null                                            |
| public              | events                      | delete_reason                | text                        | YES         | null                                            |
| public              | events                      | last_edited_at               | timestamp with time zone    | YES         | null                                            |
| public              | events                      | last_edited_by               | text                        | YES         | null                                            |
| public              | events                      | edit_count                   | integer                     | YES         | 0                                               |
| public              | events                      | image_ai_generated           | boolean                     | YES         | false                                           |
| public              | events                      | image_generation_cost        | numeric                     | YES         | null                                            |
| public              | events                      | image_generation_prompt      | text                        | YES         | null                                            |
| public              | events                      | image_generation_model       | character varying           | YES         | null                                            |
| public              | events                      | happenlist_summary           | text                        | YES         | null                                            |
| public              | events                      | organizer_description        | text                        | YES         | null                                            |
| public              | events_image_hosting_status | id                           | uuid                        | YES         | null                                            |
| public              | events_image_hosting_status | title                        | text                        | YES         | null                                            |
| public              | events_image_hosting_status | slug                         | text                        | YES         | null                                            |
| public              | events_image_hosting_status | instance_date                | date                        | YES         | null                                            |
| public              | events_image_hosting_status | source                       | text                        | YES         | null                                            |
| public              | events_image_hosting_status | image_url                    | text                        | YES         | null                                            |
| public              | events_image_hosting_status | image_hosted                 | boolean                     | YES         | null                                            |
| public              | events_image_hosting_status | image_storage_path           | text                        | YES         | null                                            |
| public              | events_image_hosting_status | raw_image_url                | text                        | YES         | null                                            |
| public              | events_image_hosting_status | thumbnail_url                | text                        | YES         | null                                            |
| public              | events_image_hosting_status | thumbnail_hosted             | boolean                     | YES         | null                                            |
| public              | events_image_hosting_status | thumbnail_storage_path       | text                        | YES         | null                                            |
| public              | events_image_hosting_status | flyer_url                    | text                        | YES         | null                                            |
| public              | events_image_hosting_status | flyer_hosted                 | boolean                     | YES         | null                                            |
| public              | events_image_hosting_status | flyer_storage_path           | text                        | YES         | null                                            |
| public              | events_image_hosting_status | image_status                 | text                        | YES         | null                                            |
| public              | events_image_hosting_status | created_at                   | timestamp with time zone    | YES         | null                                            |
| public              | events_image_status         | id                           | uuid                        | YES         | null                                            |
| public              | events_image_status         | title                        | text                        | YES         | null                                            |
| public              | events_image_status         | slug                         | text                        | YES         | null                                            |
| public              | events_image_status         | instance_date                | date                        | YES         | null                                            |
| public              | events_image_status         | image_url                    | text                        | YES         | null                                            |
| public              | events_image_status         | raw_image_url                | text                        | YES         | null                                            |
| public              | events_image_status         | thumbnail_url                | text                        | YES         | null                                            |
| public              | events_image_status         | raw_thumbnail_url            | text                        | YES         | null                                            |
| public              | events_image_status         | image_validated              | boolean                     | YES         | null                                            |
| public              | events_image_status         | image_validated_at           | timestamp with time zone    | YES         | null                                            |
| public              | events_image_status         | image_validation_notes       | text                        | YES         | null                                            |
| public              | events_image_status         | source                       | text                        | YES         | null                                            |
| public              | events_image_status         | source_url                   | text                        | YES         | null                                            |
| public              | events_image_status         | status                       | text                        | YES         | null                                            |
| public              | events_image_status         | image_status                 | text                        | YES         | null                                            |
| public              | events_pending_review       | id                           | uuid                        | YES         | null                                            |
| public              | events_pending_review       | title                        | text                        | YES         | null                                            |
| public              | events_pending_review       | slug                         | text                        | YES         | null                                            |
| public              | events_pending_review       | description                  | text                        | YES         | null                                            |
| public              | events_pending_review       | short_description            | text                        | YES         | null                                            |
| public              | events_pending_review       | start_datetime               | timestamp with time zone    | YES         | null                                            |
| public              | events_pending_review       | end_datetime                 | timestamp with time zone    | YES         | null                                            |
| public              | events_pending_review       | instance_date                | date                        | YES         | null                                            |
| public              | events_pending_review       | on_sale_date                 | date                        | YES         | null                                            |
| public              | events_pending_review       | is_all_day                   | boolean                     | YES         | null                                            |
| public              | events_pending_review       | timezone                     | text                        | YES         | null                                            |
| public              | events_pending_review       | event_type                   | text                        | YES         | null                                            |
| public              | events_pending_review       | recurrence_parent_id         | uuid                        | YES         | null                                            |
| public              | events_pending_review       | is_recurrence_template       | boolean                     | YES         | null                                            |
| public              | events_pending_review       | recurrence_pattern           | jsonb                       | YES         | null                                            |
| public              | events_pending_review       | series_id                    | uuid                        | YES         | null                                            |
| public              | events_pending_review       | location_id                  | uuid                        | YES         | null                                            |
| public              | events_pending_review       | organizer_id                 | uuid                        | YES         | null                                            |
| public              | events_pending_review       | category_id                  | uuid                        | YES         | null                                            |
| public              | events_pending_review       | price_type                   | text                        | YES         | null                                            |
| public              | events_pending_review       | price_low                    | numeric                     | YES         | null                                            |
| public              | events_pending_review       | price_high                   | numeric                     | YES         | null                                            |
| public              | events_pending_review       | price_details                | text                        | YES         | null                                            |
| public              | events_pending_review       | is_free                      | boolean                     | YES         | null                                            |
| public              | events_pending_review       | ticket_url                   | text                        | YES         | null                                            |
| public              | events_pending_review       | image_url                    | text                        | YES         | null                                            |
| public              | events_pending_review       | flyer_url                    | text                        | YES         | null                                            |
| public              | events_pending_review       | thumbnail_url                | text                        | YES         | null                                            |
| public              | events_pending_review       | meta_title                   | text                        | YES         | null                                            |
| public              | events_pending_review       | meta_description             | text                        | YES         | null                                            |
| public              | events_pending_review       | heart_count                  | integer                     | YES         | null                                            |
| public              | events_pending_review       | view_count                   | integer                     | YES         | null                                            |
| public              | events_pending_review       | status                       | text                        | YES         | null                                            |
| public              | events_pending_review       | is_featured                  | boolean                     | YES         | null                                            |
| public              | events_pending_review       | featured_order               | integer                     | YES         | null                                            |
| public              | events_pending_review       | created_at                   | timestamp with time zone    | YES         | null                                            |
| public              | events_pending_review       | updated_at                   | timestamp with time zone    | YES         | null                                            |
| public              | events_pending_review       | published_at                 | timestamp with time zone    | YES         | null                                            |
| public              | events_pending_review       | source                       | text                        | YES         | null                                            |
| public              | events_pending_review       | source_url                   | text                        | YES         | null                                            |
| public              | events_pending_review       | source_id                    | text                        | YES         | null                                            |
| public              | events_pending_review       | scraped_at                   | timestamp with time zone    | YES         | null                                            |
| public              | events_pending_review       | scraped_data                 | jsonb                       | YES         | null                                            |
| public              | events_pending_review       | reviewed_at                  | timestamp with time zone    | YES         | null                                            |
| public              | events_pending_review       | reviewed_by                  | text                        | YES         | null                                            |
| public              | events_pending_review       | review_notes                 | text                        | YES         | null                                            |
| public              | events_pending_review       | rejection_reason             | text                        | YES         | null                                            |
| public              | events_pending_review       | raw_image_url                | text                        | YES         | null                                            |
| public              | events_pending_review       | raw_thumbnail_url            | text                        | YES         | null                                            |
| public              | events_pending_review       | image_validated              | boolean                     | YES         | null                                            |
| public              | events_pending_review       | image_validated_at           | timestamp with time zone    | YES         | null                                            |
| public              | events_pending_review       | image_validation_notes       | text                        | YES         | null                                            |
| public              | events_pending_review       | image_hosted                 | boolean                     | YES         | null                                            |
| public              | events_pending_review       | image_storage_path           | text                        | YES         | null                                            |
| public              | events_pending_review       | thumbnail_hosted             | boolean                     | YES         | null                                            |
| public              | events_pending_review       | thumbnail_storage_path       | text                        | YES         | null                                            |
| public              | events_pending_review       | flyer_hosted                 | boolean                     | YES         | null                                            |
| public              | events_pending_review       | flyer_storage_path           | text                        | YES         | null                                            |
| public              | events_pending_review       | series_sequence              | integer                     | YES         | null                                            |
| public              | events_pending_review       | is_series_instance           | boolean                     | YES         | null                                            |
| public              | events_pending_review       | submitted_by_email           | text                        | YES         | null                                            |
| public              | events_pending_review       | submitted_by_name            | text                        | YES         | null                                            |
| public              | events_pending_review       | submitted_at                 | timestamp with time zone    | YES         | null                                            |
| public              | events_pending_review       | change_request_message       | text                        | YES         | null                                            |
| public              | events_pending_review       | deleted_at                   | timestamp with time zone    | YES         | null                                            |
| public              | events_pending_review       | deleted_by                   | text                        | YES         | null                                            |
| public              | events_pending_review       | delete_reason                | text                        | YES         | null                                            |
| public              | events_pending_review       | last_edited_at               | timestamp with time zone    | YES         | null                                            |
| public              | events_pending_review       | last_edited_by               | text                        | YES         | null                                            |
| public              | events_pending_review       | edit_count                   | integer                     | YES         | null                                            |
| public              | events_pending_review       | image_ai_generated           | boolean                     | YES         | null                                            |
| public              | events_pending_review       | image_generation_cost        | numeric                     | YES         | null                                            |
| public              | events_pending_review       | image_generation_prompt      | text                        | YES         | null                                            |
| public              | events_pending_review       | image_generation_model       | character varying           | YES         | null                                            |
| public              | events_pending_review       | category_name                | text                        | YES         | null                                            |
| public              | events_pending_review       | category_slug                | text                        | YES         | null                                            |
| public              | events_pending_review       | category_icon                | text                        | YES         | null                                            |
| public              | events_pending_review       | location_name                | text                        | YES         | null                                            |
| public              | events_pending_review       | location_slug                | text                        | YES         | null                                            |
| public              | events_pending_review       | location_city                | text                        | YES         | null                                            |
| public              | events_pending_review       | location_address             | text                        | YES         | null                                            |
| public              | events_pending_review       | organizer_name               | text                        | YES         | null                                            |
| public              | events_pending_review       | organizer_slug               | text                        | YES         | null                                            |
| public              | events_pending_review       | organizer_logo               | text                        | YES         | null                                            |
| public              | events_with_details         | id                           | uuid                        | YES         | null                                            |
| public              | events_with_details         | title                        | text                        | YES         | null                                            |
| public              | events_with_details         | slug                         | text                        | YES         | null                                            |
| public              | events_with_details         | description                  | text                        | YES         | null                                            |
| public              | events_with_details         | short_description            | text                        | YES         | null                                            |
| public              | events_with_details         | start_datetime               | timestamp with time zone    | YES         | null                                            |
| public              | events_with_details         | end_datetime                 | timestamp with time zone    | YES         | null                                            |
| public              | events_with_details         | instance_date                | date                        | YES         | null                                            |
| public              | events_with_details         | on_sale_date                 | date                        | YES         | null                                            |
| public              | events_with_details         | is_all_day                   | boolean                     | YES         | null                                            |
| public              | events_with_details         | timezone                     | text                        | YES         | null                                            |
| public              | events_with_details         | event_type                   | text                        | YES         | null                                            |
| public              | events_with_details         | recurrence_parent_id         | uuid                        | YES         | null                                            |
| public              | events_with_details         | is_recurrence_template       | boolean                     | YES         | null                                            |
| public              | events_with_details         | recurrence_pattern           | jsonb                       | YES         | null                                            |
| public              | events_with_details         | series_id                    | uuid                        | YES         | null                                            |
| public              | events_with_details         | location_id                  | uuid                        | YES         | null                                            |
| public              | events_with_details         | organizer_id                 | uuid                        | YES         | null                                            |
| public              | events_with_details         | category_id                  | uuid                        | YES         | null                                            |
| public              | events_with_details         | price_type                   | text                        | YES         | null                                            |
| public              | events_with_details         | price_low                    | numeric                     | YES         | null                                            |
| public              | events_with_details         | price_high                   | numeric                     | YES         | null                                            |
| public              | events_with_details         | price_details                | text                        | YES         | null                                            |
| public              | events_with_details         | is_free                      | boolean                     | YES         | null                                            |
| public              | events_with_details         | ticket_url                   | text                        | YES         | null                                            |
| public              | events_with_details         | image_url                    | text                        | YES         | null                                            |
| public              | events_with_details         | flyer_url                    | text                        | YES         | null                                            |
| public              | events_with_details         | thumbnail_url                | text                        | YES         | null                                            |
| public              | events_with_details         | meta_title                   | text                        | YES         | null                                            |
| public              | events_with_details         | meta_description             | text                        | YES         | null                                            |
| public              | events_with_details         | heart_count                  | integer                     | YES         | null                                            |
| public              | events_with_details         | view_count                   | integer                     | YES         | null                                            |
| public              | events_with_details         | status                       | text                        | YES         | null                                            |
| public              | events_with_details         | is_featured                  | boolean                     | YES         | null                                            |
| public              | events_with_details         | featured_order               | integer                     | YES         | null                                            |
| public              | events_with_details         | created_at                   | timestamp with time zone    | YES         | null                                            |
| public              | events_with_details         | updated_at                   | timestamp with time zone    | YES         | null                                            |
| public              | events_with_details         | published_at                 | timestamp with time zone    | YES         | null                                            |
| public              | events_with_details         | category_name                | text                        | YES         | null                                            |
| public              | events_with_details         | category_slug                | text                        | YES         | null                                            |
| public              | events_with_details         | category_icon                | text                        | YES         | null                                            |
| public              | events_with_details         | location_name                | text                        | YES         | null                                            |
| public              | events_with_details         | location_slug                | text                        | YES         | null                                            |
| public              | events_with_details         | location_city                | text                        | YES         | null                                            |
| public              | events_with_details         | location_address             | text                        | YES         | null                                            |
| public              | events_with_details         | location_lat                 | numeric                     | YES         | null                                            |
| public              | events_with_details         | location_lng                 | numeric                     | YES         | null                                            |
| public              | events_with_details         | organizer_name               | text                        | YES         | null                                            |
| public              | events_with_details         | organizer_slug               | text                        | YES         | null                                            |
| public              | events_with_details         | organizer_logo               | text                        | YES         | null                                            |
| public              | hearts                      | id                           | uuid                        | NO          | gen_random_uuid()                               |
| public              | hearts                      | user_id                      | uuid                        | NO          | null                                            |
| public              | hearts                      | event_id                     | uuid                        | NO          | null                                            |
| public              | hearts                      | created_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | locations                   | id                           | uuid                        | NO          | gen_random_uuid()                               |
| public              | locations                   | name                         | text                        | NO          | null                                            |
| public              | locations                   | slug                         | text                        | NO          | null                                            |
| public              | locations                   | description                  | text                        | YES         | null                                            |
| public              | locations                   | address_line                 | text                        | YES         | null                                            |
| public              | locations                   | address_line_2               | text                        | YES         | null                                            |
| public              | locations                   | city                         | text                        | NO          | null                                            |
| public              | locations                   | state                        | text                        | YES         | null                                            |
| public              | locations                   | postal_code                  | text                        | YES         | null                                            |
| public              | locations                   | country                      | text                        | YES         | 'US'::text                                      |
| public              | locations                   | latitude                     | numeric                     | YES         | null                                            |
| public              | locations                   | longitude                    | numeric                     | YES         | null                                            |
| public              | locations                   | venue_type                   | text                        | YES         | 'venue'::text                                   |
| public              | locations                   | website_url                  | text                        | YES         | null                                            |
| public              | locations                   | phone                        | text                        | YES         | null                                            |
| public              | locations                   | image_url                    | text                        | YES         | null                                            |
| public              | locations                   | meta_title                   | text                        | YES         | null                                            |
| public              | locations                   | meta_description             | text                        | YES         | null                                            |
| public              | locations                   | is_active                    | boolean                     | YES         | true                                            |
| public              | locations                   | created_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | locations                   | updated_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | organizer_claim_log         | id                           | uuid                        | NO          | gen_random_uuid()                               |
| public              | organizer_claim_log         | organizer_id                 | uuid                        | NO          | null                                            |
| public              | organizer_claim_log         | user_id                      | uuid                        | NO          | null                                            |
| public              | organizer_claim_log         | user_email                   | text                        | NO          | null                                            |
| public              | organizer_claim_log         | action                       | text                        | NO          | null                                            |
| public              | organizer_claim_log         | notes                        | text                        | YES         | null                                            |
| public              | organizer_claim_log         | created_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | organizer_users             | id                           | uuid                        | NO          | gen_random_uuid()                               |
| public              | organizer_users             | organizer_id                 | uuid                        | NO          | null                                            |
| public              | organizer_users             | user_id                      | uuid                        | NO          | null                                            |
| public              | organizer_users             | user_email                   | text                        | NO          | null                                            |
| public              | organizer_users             | role                         | text                        | YES         | 'member'::text                                  |
| public              | organizer_users             | status                       | text                        | YES         | 'pending'::text                                 |
| public              | organizer_users             | claim_message                | text                        | YES         | null                                            |
| public              | organizer_users             | requested_at                 | timestamp with time zone    | YES         | now()                                           |
| public              | organizer_users             | reviewed_at                  | timestamp with time zone    | YES         | null                                            |
| public              | organizer_users             | reviewed_by                  | text                        | YES         | null                                            |
| public              | organizer_users             | rejection_reason             | text                        | YES         | null                                            |
| public              | organizer_users             | admin_notes                  | text                        | YES         | null                                            |
| public              | organizer_users             | created_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | organizer_users             | updated_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | organizers                  | id                           | uuid                        | NO          | gen_random_uuid()                               |
| public              | organizers                  | name                         | text                        | NO          | null                                            |
| public              | organizers                  | slug                         | text                        | NO          | null                                            |
| public              | organizers                  | description                  | text                        | YES         | null                                            |
| public              | organizers                  | logo_url                     | text                        | YES         | null                                            |
| public              | organizers                  | website_url                  | text                        | YES         | null                                            |
| public              | organizers                  | email                        | text                        | YES         | null                                            |
| public              | organizers                  | phone                        | text                        | YES         | null                                            |
| public              | organizers                  | social_links                 | jsonb                       | YES         | '{}'::jsonb                                     |
| public              | organizers                  | meta_title                   | text                        | YES         | null                                            |
| public              | organizers                  | meta_description             | text                        | YES         | null                                            |
| public              | organizers                  | is_active                    | boolean                     | YES         | true                                            |
| public              | organizers                  | is_verified                  | boolean                     | YES         | false                                           |
| public              | organizers                  | created_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | organizers                  | updated_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | organizers                  | user_id                      | uuid                        | YES         | null                                            |
| public              | organizers                  | claimed_at                   | timestamp with time zone    | YES         | null                                            |
| public              | organizers                  | claim_verified               | boolean                     | YES         | false                                           |
| public              | organizers                  | claim_verification_token     | text                        | YES         | null                                            |
| public              | organizers                  | claim_verification_expires   | timestamp with time zone    | YES         | null                                            |
| public              | profiles                    | id                           | uuid                        | NO          | null                                            |
| public              | profiles                    | email                        | text                        | NO          | null                                            |
| public              | profiles                    | display_name                 | text                        | YES         | null                                            |
| public              | profiles                    | avatar_url                   | text                        | YES         | null                                            |
| public              | profiles                    | email_notifications          | boolean                     | YES         | true                                            |
| public              | profiles                    | email_weekly_digest          | boolean                     | YES         | false                                           |
| public              | profiles                    | timezone                     | text                        | YES         | 'America/Chicago'::text                         |
| public              | profiles                    | created_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | profiles                    | updated_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | profiles                    | notify_on_approval           | boolean                     | YES         | true                                            |
| public              | profiles                    | notify_on_rejection          | boolean                     | YES         | true                                            |
| public              | profiles                    | notify_on_new_events         | boolean                     | YES         | true                                            |
| public              | profiles                    | preferred_city               | text                        | YES         | 'Milwaukee'::text                               |
| public              | profiles                    | preferred_state              | text                        | YES         | 'WI'::text                                      |
| public              | series                      | id                           | uuid                        | NO          | gen_random_uuid()                               |
| public              | series                      | title                        | text                        | NO          | null                                            |
| public              | series                      | slug                         | text                        | NO          | null                                            |
| public              | series                      | description                  | text                        | YES         | null                                            |
| public              | series                      | short_description            | text                        | YES         | null                                            |
| public              | series                      | series_type                  | text                        | NO          | 'class'::text                                   |
| public              | series                      | total_sessions               | integer                     | YES         | null                                            |
| public              | series                      | sessions_remaining           | integer                     | YES         | null                                            |
| public              | series                      | start_date                   | date                        | YES         | null                                            |
| public              | series                      | end_date                     | date                        | YES         | null                                            |
| public              | series                      | recurrence_rule              | jsonb                       | YES         | null                                            |
| public              | series                      | organizer_id                 | uuid                        | YES         | null                                            |
| public              | series                      | category_id                  | uuid                        | YES         | null                                            |
| public              | series                      | location_id                  | uuid                        | YES         | null                                            |
| public              | series                      | price_type                   | text                        | YES         | 'per_session'::text                             |
| public              | series                      | price_low                    | numeric                     | YES         | null                                            |
| public              | series                      | price_high                   | numeric                     | YES         | null                                            |
| public              | series                      | price_details                | text                        | YES         | null                                            |
| public              | series                      | is_free                      | boolean                     | YES         | false                                           |
| public              | series                      | registration_url             | text                        | YES         | null                                            |
| public              | series                      | registration_required        | boolean                     | YES         | false                                           |
| public              | series                      | capacity                     | integer                     | YES         | null                                            |
| public              | series                      | waitlist_enabled             | boolean                     | YES         | false                                           |
| public              | series                      | image_url                    | text                        | YES         | null                                            |
| public              | series                      | image_hosted                 | boolean                     | YES         | false                                           |
| public              | series                      | image_storage_path           | text                        | YES         | null                                            |
| public              | series                      | thumbnail_url                | text                        | YES         | null                                            |
| public              | series                      | meta_title                   | text                        | YES         | null                                            |
| public              | series                      | meta_description             | text                        | YES         | null                                            |
| public              | series                      | status                       | text                        | YES         | 'draft'::text                                   |
| public              | series                      | is_featured                  | boolean                     | YES         | false                                           |
| public              | series                      | featured_order               | integer                     | YES         | null                                            |
| public              | series                      | heart_count                  | integer                     | YES         | 0                                               |
| public              | series                      | view_count                   | integer                     | YES         | 0                                               |
| public              | series                      | enrollment_count             | integer                     | YES         | 0                                               |
| public              | series                      | source                       | text                        | YES         | 'manual'::text                                  |
| public              | series                      | source_url                   | text                        | YES         | null                                            |
| public              | series                      | created_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | series                      | updated_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | series                      | published_at                 | timestamp with time zone    | YES         | null                                            |
| public              | series_upcoming             | id                           | uuid                        | YES         | null                                            |
| public              | series_upcoming             | title                        | text                        | YES         | null                                            |
| public              | series_upcoming             | slug                         | text                        | YES         | null                                            |
| public              | series_upcoming             | description                  | text                        | YES         | null                                            |
| public              | series_upcoming             | short_description            | text                        | YES         | null                                            |
| public              | series_upcoming             | series_type                  | text                        | YES         | null                                            |
| public              | series_upcoming             | total_sessions               | integer                     | YES         | null                                            |
| public              | series_upcoming             | sessions_remaining           | integer                     | YES         | null                                            |
| public              | series_upcoming             | start_date                   | date                        | YES         | null                                            |
| public              | series_upcoming             | end_date                     | date                        | YES         | null                                            |
| public              | series_upcoming             | recurrence_rule              | jsonb                       | YES         | null                                            |
| public              | series_upcoming             | organizer_id                 | uuid                        | YES         | null                                            |
| public              | series_upcoming             | category_id                  | uuid                        | YES         | null                                            |
| public              | series_upcoming             | location_id                  | uuid                        | YES         | null                                            |
| public              | series_upcoming             | price_type                   | text                        | YES         | null                                            |
| public              | series_upcoming             | price_low                    | numeric                     | YES         | null                                            |
| public              | series_upcoming             | price_high                   | numeric                     | YES         | null                                            |
| public              | series_upcoming             | price_details                | text                        | YES         | null                                            |
| public              | series_upcoming             | is_free                      | boolean                     | YES         | null                                            |
| public              | series_upcoming             | registration_url             | text                        | YES         | null                                            |
| public              | series_upcoming             | registration_required        | boolean                     | YES         | null                                            |
| public              | series_upcoming             | capacity                     | integer                     | YES         | null                                            |
| public              | series_upcoming             | waitlist_enabled             | boolean                     | YES         | null                                            |
| public              | series_upcoming             | image_url                    | text                        | YES         | null                                            |
| public              | series_upcoming             | image_hosted                 | boolean                     | YES         | null                                            |
| public              | series_upcoming             | image_storage_path           | text                        | YES         | null                                            |
| public              | series_upcoming             | thumbnail_url                | text                        | YES         | null                                            |
| public              | series_upcoming             | meta_title                   | text                        | YES         | null                                            |
| public              | series_upcoming             | meta_description             | text                        | YES         | null                                            |
| public              | series_upcoming             | status                       | text                        | YES         | null                                            |
| public              | series_upcoming             | is_featured                  | boolean                     | YES         | null                                            |
| public              | series_upcoming             | featured_order               | integer                     | YES         | null                                            |
| public              | series_upcoming             | heart_count                  | integer                     | YES         | null                                            |
| public              | series_upcoming             | view_count                   | integer                     | YES         | null                                            |
| public              | series_upcoming             | enrollment_count             | integer                     | YES         | null                                            |
| public              | series_upcoming             | source                       | text                        | YES         | null                                            |
| public              | series_upcoming             | source_url                   | text                        | YES         | null                                            |
| public              | series_upcoming             | created_at                   | timestamp with time zone    | YES         | null                                            |
| public              | series_upcoming             | updated_at                   | timestamp with time zone    | YES         | null                                            |
| public              | series_upcoming             | published_at                 | timestamp with time zone    | YES         | null                                            |
| public              | series_with_details         | id                           | uuid                        | YES         | null                                            |
| public              | series_with_details         | title                        | text                        | YES         | null                                            |
| public              | series_with_details         | slug                         | text                        | YES         | null                                            |
| public              | series_with_details         | description                  | text                        | YES         | null                                            |
| public              | series_with_details         | short_description            | text                        | YES         | null                                            |
| public              | series_with_details         | series_type                  | text                        | YES         | null                                            |
| public              | series_with_details         | total_sessions               | integer                     | YES         | null                                            |
| public              | series_with_details         | sessions_remaining           | integer                     | YES         | null                                            |
| public              | series_with_details         | start_date                   | date                        | YES         | null                                            |
| public              | series_with_details         | end_date                     | date                        | YES         | null                                            |
| public              | series_with_details         | recurrence_rule              | jsonb                       | YES         | null                                            |
| public              | series_with_details         | organizer_id                 | uuid                        | YES         | null                                            |
| public              | series_with_details         | category_id                  | uuid                        | YES         | null                                            |
| public              | series_with_details         | location_id                  | uuid                        | YES         | null                                            |
| public              | series_with_details         | price_type                   | text                        | YES         | null                                            |
| public              | series_with_details         | price_low                    | numeric                     | YES         | null                                            |
| public              | series_with_details         | price_high                   | numeric                     | YES         | null                                            |
| public              | series_with_details         | price_details                | text                        | YES         | null                                            |
| public              | series_with_details         | is_free                      | boolean                     | YES         | null                                            |
| public              | series_with_details         | registration_url             | text                        | YES         | null                                            |
| public              | series_with_details         | registration_required        | boolean                     | YES         | null                                            |
| public              | series_with_details         | capacity                     | integer                     | YES         | null                                            |
| public              | series_with_details         | waitlist_enabled             | boolean                     | YES         | null                                            |
| public              | series_with_details         | image_url                    | text                        | YES         | null                                            |
| public              | series_with_details         | image_hosted                 | boolean                     | YES         | null                                            |
| public              | series_with_details         | image_storage_path           | text                        | YES         | null                                            |
| public              | series_with_details         | thumbnail_url                | text                        | YES         | null                                            |
| public              | series_with_details         | meta_title                   | text                        | YES         | null                                            |
| public              | series_with_details         | meta_description             | text                        | YES         | null                                            |
| public              | series_with_details         | status                       | text                        | YES         | null                                            |
| public              | series_with_details         | is_featured                  | boolean                     | YES         | null                                            |
| public              | series_with_details         | featured_order               | integer                     | YES         | null                                            |
| public              | series_with_details         | heart_count                  | integer                     | YES         | null                                            |
| public              | series_with_details         | view_count                   | integer                     | YES         | null                                            |
| public              | series_with_details         | enrollment_count             | integer                     | YES         | null                                            |
| public              | series_with_details         | source                       | text                        | YES         | null                                            |
| public              | series_with_details         | source_url                   | text                        | YES         | null                                            |
| public              | series_with_details         | created_at                   | timestamp with time zone    | YES         | null                                            |
| public              | series_with_details         | updated_at                   | timestamp with time zone    | YES         | null                                            |
| public              | series_with_details         | published_at                 | timestamp with time zone    | YES         | null                                            |
| public              | series_with_details         | category_name                | text                        | YES         | null                                            |
| public              | series_with_details         | category_slug                | text                        | YES         | null                                            |
| public              | series_with_details         | category_icon                | text                        | YES         | null                                            |
| public              | series_with_details         | location_name                | text                        | YES         | null                                            |
| public              | series_with_details         | location_slug                | text                        | YES         | null                                            |
| public              | series_with_details         | location_city                | text                        | YES         | null                                            |
| public              | series_with_details         | organizer_name               | text                        | YES         | null                                            |
| public              | series_with_details         | organizer_slug               | text                        | YES         | null                                            |
| public              | series_with_details         | organizer_logo               | text                        | YES         | null                                            |
| public              | series_with_details         | upcoming_event_count         | bigint                      | YES         | null                                            |
| public              | series_with_details         | next_event_date              | date                        | YES         | null                                            |
| public              | user_follows                | id                           | uuid                        | NO          | gen_random_uuid()                               |
| public              | user_follows                | user_id                      | uuid                        | NO          | null                                            |
| public              | user_follows                | organizer_id                 | uuid                        | YES         | null                                            |
| public              | user_follows                | venue_id                     | uuid                        | YES         | null                                            |
| public              | user_follows                | category_id                  | uuid                        | YES         | null                                            |
| public              | user_follows                | notify_new_events            | boolean                     | YES         | true                                            |
| public              | user_follows                | created_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | user_roles                  | id                           | uuid                        | NO          | gen_random_uuid()                               |
| public              | user_roles                  | user_email                   | text                        | NO          | null                                            |
| public              | user_roles                  | role                         | text                        | NO          | null                                            |
| public              | user_roles                  | notes                        | text                        | YES         | null                                            |
| public              | user_roles                  | granted_by                   | text                        | YES         | null                                            |
| public              | user_roles                  | created_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | user_roles                  | updated_at                   | timestamp with time zone    | YES         | now()                                           |
| public              | v_admin_submission_queue    | id                           | uuid                        | YES         | null                                            |
| public              | v_admin_submission_queue    | title                        | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | slug                         | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | status                       | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | instance_date                | date                        | YES         | null                                            |
| public              | v_admin_submission_queue    | start_datetime               | timestamp with time zone    | YES         | null                                            |
| public              | v_admin_submission_queue    | end_datetime                 | timestamp with time zone    | YES         | null                                            |
| public              | v_admin_submission_queue    | image_url                    | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | description                  | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | short_description            | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | submitted_at                 | timestamp with time zone    | YES         | null                                            |
| public              | v_admin_submission_queue    | submitted_by_email           | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | submitted_by_name            | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | source                       | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | source_url                   | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | created_at                   | timestamp with time zone    | YES         | null                                            |
| public              | v_admin_submission_queue    | price_type                   | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | price_low                    | numeric                     | YES         | null                                            |
| public              | v_admin_submission_queue    | price_high                   | numeric                     | YES         | null                                            |
| public              | v_admin_submission_queue    | is_free                      | boolean                     | YES         | null                                            |
| public              | v_admin_submission_queue    | ticket_url                   | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | change_request_message       | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | category_id                  | uuid                        | YES         | null                                            |
| public              | v_admin_submission_queue    | category_name                | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | category_slug                | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | location_id                  | uuid                        | YES         | null                                            |
| public              | v_admin_submission_queue    | location_name                | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | location_city                | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | location_address             | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | organizer_id                 | uuid                        | YES         | null                                            |
| public              | v_admin_submission_queue    | organizer_name               | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | series_id                    | uuid                        | YES         | null                                            |
| public              | v_admin_submission_queue    | series_title                 | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | series_type                  | text                        | YES         | null                                            |
| public              | v_admin_submission_queue    | submitter_approved_count     | bigint                      | YES         | null                                            |
| public              | v_admin_submission_queue    | submitter_total_count        | bigint                      | YES         | null                                            |
| public              | v_my_submissions            | id                           | uuid                        | YES         | null                                            |
| public              | v_my_submissions            | title                        | text                        | YES         | null                                            |
| public              | v_my_submissions            | slug                         | text                        | YES         | null                                            |
| public              | v_my_submissions            | status                       | text                        | YES         | null                                            |
| public              | v_my_submissions            | instance_date                | date                        | YES         | null                                            |
| public              | v_my_submissions            | start_datetime               | timestamp with time zone    | YES         | null                                            |
| public              | v_my_submissions            | end_datetime                 | timestamp with time zone    | YES         | null                                            |
| public              | v_my_submissions            | image_url                    | text                        | YES         | null                                            |
| public              | v_my_submissions            | description                  | text                        | YES         | null                                            |
| public              | v_my_submissions            | short_description            | text                        | YES         | null                                            |
| public              | v_my_submissions            | submitted_at                 | timestamp with time zone    | YES         | null                                            |
| public              | v_my_submissions            | submitted_by_email           | text                        | YES         | null                                            |
| public              | v_my_submissions            | submitted_by_name            | text                        | YES         | null                                            |
| public              | v_my_submissions            | reviewed_at                  | timestamp with time zone    | YES         | null                                            |
| public              | v_my_submissions            | reviewed_by                  | text                        | YES         | null                                            |
| public              | v_my_submissions            | review_notes                 | text                        | YES         | null                                            |
| public              | v_my_submissions            | rejection_reason             | text                        | YES         | null                                            |
| public              | v_my_submissions            | change_request_message       | text                        | YES         | null                                            |
| public              | v_my_submissions            | source                       | text                        | YES         | null                                            |
| public              | v_my_submissions            | created_at                   | timestamp with time zone    | YES         | null                                            |
| public              | v_my_submissions            | updated_at                   | timestamp with time zone    | YES         | null                                            |
| public              | v_my_submissions            | deleted_at                   | timestamp with time zone    | YES         | null                                            |
| public              | v_my_submissions            | price_type                   | text                        | YES         | null                                            |
| public              | v_my_submissions            | price_low                    | numeric                     | YES         | null                                            |
| public              | v_my_submissions            | price_high                   | numeric                     | YES         | null                                            |
| public              | v_my_submissions            | is_free                      | boolean                     | YES         | null                                            |
| public              | v_my_submissions            | category_id                  | uuid                        | YES         | null                                            |
| public              | v_my_submissions            | category_name                | text                        | YES         | null                                            |
| public              | v_my_submissions            | category_slug                | text                        | YES         | null                                            |
| public              | v_my_submissions            | location_id                  | uuid                        | YES         | null                                            |
| public              | v_my_submissions            | location_name                | text                        | YES         | null                                            |
| public              | v_my_submissions            | location_city                | text                        | YES         | null                                            |
| public              | v_my_submissions            | location_address             | text                        | YES         | null                                            |
| public              | v_my_submissions            | series_id                    | uuid                        | YES         | null                                            |
| public              | v_my_submissions            | series_title                 | text                        | YES         | null                                            |
| public              | v_my_submissions            | series_slug                  | text                        | YES         | null                                            |
| public              | v_my_submissions            | series_type                  | text                        | YES         | null                                            |
| public              | v_superadmin_events         | id                           | uuid                        | YES         | null                                            |
| public              | v_superadmin_events         | title                        | text                        | YES         | null                                            |
| public              | v_superadmin_events         | slug                         | text                        | YES         | null                                            |
| public              | v_superadmin_events         | status                       | text                        | YES         | null                                            |
| public              | v_superadmin_events         | source                       | text                        | YES         | null                                            |
| public              | v_superadmin_events         | instance_date                | date                        | YES         | null                                            |
| public              | v_superadmin_events         | start_datetime               | timestamp with time zone    | YES         | null                                            |
| public              | v_superadmin_events         | end_datetime                 | timestamp with time zone    | YES         | null                                            |
| public              | v_superadmin_events         | is_all_day                   | boolean                     | YES         | null                                            |
| public              | v_superadmin_events         | description                  | text                        | YES         | null                                            |
| public              | v_superadmin_events         | short_description            | text                        | YES         | null                                            |
| public              | v_superadmin_events         | image_url                    | text                        | YES         | null                                            |
| public              | v_superadmin_events         | thumbnail_url                | text                        | YES         | null                                            |
| public              | v_superadmin_events         | price_type                   | text                        | YES         | null                                            |
| public              | v_superadmin_events         | price_low                    | numeric                     | YES         | null                                            |
| public              | v_superadmin_events         | price_high                   | numeric                     | YES         | null                                            |
| public              | v_superadmin_events         | is_free                      | boolean                     | YES         | null                                            |
| public              | v_superadmin_events         | ticket_url                   | text                        | YES         | null                                            |
| public              | v_superadmin_events         | submitted_by_email           | text                        | YES         | null                                            |
| public              | v_superadmin_events         | submitted_by_name            | text                        | YES         | null                                            |
| public              | v_superadmin_events         | submitted_at                 | timestamp with time zone    | YES         | null                                            |
| public              | v_superadmin_events         | reviewed_at                  | timestamp with time zone    | YES         | null                                            |
| public              | v_superadmin_events         | reviewed_by                  | text                        | YES         | null                                            |
| public              | v_superadmin_events         | review_notes                 | text                        | YES         | null                                            |
| public              | v_superadmin_events         | rejection_reason             | text                        | YES         | null                                            |
| public              | v_superadmin_events         | change_request_message       | text                        | YES         | null                                            |
| public              | v_superadmin_events         | deleted_at                   | timestamp with time zone    | YES         | null                                            |
| public              | v_superadmin_events         | deleted_by                   | text                        | YES         | null                                            |
| public              | v_superadmin_events         | delete_reason                | text                        | YES         | null                                            |
| public              | v_superadmin_events         | last_edited_at               | timestamp with time zone    | YES         | null                                            |
| public              | v_superadmin_events         | last_edited_by               | text                        | YES         | null                                            |
| public              | v_superadmin_events         | edit_count                   | integer                     | YES         | null                                            |
| public              | v_superadmin_events         | created_at                   | timestamp with time zone    | YES         | null                                            |
| public              | v_superadmin_events         | updated_at                   | timestamp with time zone    | YES         | null                                            |
| public              | v_superadmin_events         | published_at                 | timestamp with time zone    | YES         | null                                            |
| public              | v_superadmin_events         | heart_count                  | integer                     | YES         | null                                            |
| public              | v_superadmin_events         | view_count                   | integer                     | YES         | null                                            |
| public              | v_superadmin_events         | category_id                  | uuid                        | YES         | null                                            |
| public              | v_superadmin_events         | category_name                | text                        | YES         | null                                            |
| public              | v_superadmin_events         | category_slug                | text                        | YES         | null                                            |
| public              | v_superadmin_events         | category_icon                | text                        | YES         | null                                            |
| public              | v_superadmin_events         | location_id                  | uuid                        | YES         | null                                            |
| public              | v_superadmin_events         | location_name                | text                        | YES         | null                                            |
| public              | v_superadmin_events         | location_slug                | text                        | YES         | null                                            |
| public              | v_superadmin_events         | location_city                | text                        | YES         | null                                            |
| public              | v_superadmin_events         | location_address             | text                        | YES         | null                                            |
| public              | v_superadmin_events         | location_type                | text                        | YES         | null                                            |
| public              | v_superadmin_events         | organizer_id                 | uuid                        | YES         | null                                            |
| public              | v_superadmin_events         | organizer_name               | text                        | YES         | null                                            |
| public              | v_superadmin_events         | organizer_slug               | text                        | YES         | null                                            |
| public              | v_superadmin_events         | organizer_logo               | text                        | YES         | null                                            |
| public              | v_superadmin_events         | series_id                    | uuid                        | YES         | null                                            |
| public              | v_superadmin_events         | series_title                 | text                        | YES         | null                                            |
| public              | v_superadmin_events         | series_slug                  | text                        | YES         | null                                            |
| public              | v_superadmin_events         | series_type                  | text                        | YES         | null                                            |
| public              | v_superadmin_events         | submitter_approved_count     | bigint                      | YES         | null                                            |
| public              | v_superadmin_events         | is_deleted                   | boolean                     | YES         | null                                            |
| public              | v_user_follows              | follow_id                    | uuid                        | YES         | null                                            |
| public              | v_user_follows              | user_id                      | uuid                        | YES         | null                                            |
| public              | v_user_follows              | notify_new_events            | boolean                     | YES         | null                                            |
| public              | v_user_follows              | followed_at                  | timestamp with time zone    | YES         | null                                            |
| public              | v_user_follows              | follow_type                  | text                        | YES         | null                                            |
| public              | v_user_follows              | organizer_id                 | uuid                        | YES         | null                                            |
| public              | v_user_follows              | organizer_name               | text                        | YES         | null                                            |
| public              | v_user_follows              | organizer_slug               | text                        | YES         | null                                            |
| public              | v_user_follows              | organizer_logo               | text                        | YES         | null                                            |
| public              | v_user_follows              | venue_id                     | uuid                        | YES         | null                                            |
| public              | v_user_follows              | venue_name                   | text                        | YES         | null                                            |
| public              | v_user_follows              | venue_slug                   | text                        | YES         | null                                            |
| public              | v_user_follows              | venue_city                   | text                        | YES         | null                                            |
| public              | v_user_follows              | category_id                  | uuid                        | YES         | null                                            |
| public              | v_user_follows              | category_name                | text                        | YES         | null                                            |
| public              | v_user_follows              | category_slug                | text                        | YES         | null                                            |
| public              | v_user_hearts               | heart_id                     | uuid                        | YES         | null                                            |
| public              | v_user_hearts               | user_id                      | uuid                        | YES         | null                                            |
| public              | v_user_hearts               | hearted_at                   | timestamp with time zone    | YES         | null                                            |
| public              | v_user_hearts               | event_id                     | uuid                        | YES         | null                                            |
| public              | v_user_hearts               | title                        | text                        | YES         | null                                            |
| public              | v_user_hearts               | slug                         | text                        | YES         | null                                            |
| public              | v_user_hearts               | instance_date                | date                        | YES         | null                                            |
| public              | v_user_hearts               | start_datetime               | timestamp with time zone    | YES         | null                                            |
| public              | v_user_hearts               | end_datetime                 | timestamp with time zone    | YES         | null                                            |
| public              | v_user_hearts               | image_url                    | text                        | YES         | null                                            |
| public              | v_user_hearts               | short_description            | text                        | YES         | null                                            |
| public              | v_user_hearts               | is_free                      | boolean                     | YES         | null                                            |
| public              | v_user_hearts               | price_low                    | numeric                     | YES         | null                                            |
| public              | v_user_hearts               | price_high                   | numeric                     | YES         | null                                            |
| public              | v_user_hearts               | status                       | text                        | YES         | null                                            |
| public              | v_user_hearts               | category_name                | text                        | YES         | null                                            |
| public              | v_user_hearts               | category_slug                | text                        | YES         | null                                            |
| public              | v_user_hearts               | location_name                | text                        | YES         | null                                            |
| public              | v_user_hearts               | location_city                | text                        | YES         | null                                            |
| public              | v_user_profile              | id                           | uuid                        | YES         | null                                            |
| public              | v_user_profile              | email                        | text                        | YES         | null                                            |
| public              | v_user_profile              | display_name                 | text                        | YES         | null                                            |
| public              | v_user_profile              | avatar_url                   | text                        | YES         | null                                            |
| public              | v_user_profile              | email_notifications          | boolean                     | YES         | null                                            |
| public              | v_user_profile              | email_weekly_digest          | boolean                     | YES         | null                                            |
| public              | v_user_profile              | timezone                     | text                        | YES         | null                                            |
| public              | v_user_profile              | created_at                   | timestamp with time zone    | YES         | null                                            |
| public              | v_user_profile              | updated_at                   | timestamp with time zone    | YES         | null                                            |
| public              | v_user_profile              | notify_on_approval           | boolean                     | YES         | null                                            |
| public              | v_user_profile              | notify_on_rejection          | boolean                     | YES         | null                                            |
| public              | v_user_profile              | notify_on_new_events         | boolean                     | YES         | null                                            |
| public              | v_user_profile              | preferred_city               | character varying           | YES         | null                                            |
| public              | v_user_profile              | user_created_at              | timestamp with time zone    | YES         | null                                            |
| public              | v_user_profile              | organizer_count              | bigint                      | YES         | null                                            |
| public              | v_user_profile              | hearts_count                 | bigint                      | YES         | null                                            |
| public              | v_user_profile              | following_count              | bigint                      | YES         | null                                            |
| public              | v_user_profile_v2           | id                           | uuid                        | YES         | null                                            |
| public              | v_user_profile_v2           | email                        | text                        | YES         | null                                            |
| public              | v_user_profile_v2           | display_name                 | text                        | YES         | null                                            |
| public              | v_user_profile_v2           | avatar_url                   | text                        | YES         | null                                            |
| public              | v_user_profile_v2           | email_notifications          | boolean                     | YES         | null                                            |
| public              | v_user_profile_v2           | email_weekly_digest          | boolean                     | YES         | null                                            |
| public              | v_user_profile_v2           | timezone                     | text                        | YES         | null                                            |
| public              | v_user_profile_v2           | created_at                   | timestamp with time zone    | YES         | null                                            |
| public              | v_user_profile_v2           | updated_at                   | timestamp with time zone    | YES         | null                                            |
| public              | v_user_profile_v2           | notify_on_approval           | boolean                     | YES         | null                                            |
| public              | v_user_profile_v2           | user_created_at              | timestamp with time zone    | YES         | null                                            |
| public              | v_user_profile_v2           | organizer_count              | bigint                      | YES         | null                                            |
| public              | v_user_profile_v2           | hearts_count                 | bigint                      | YES         | null                                            |
| realtime            | messages                    | topic                        | text                        | NO          | null                                            |
| realtime            | messages                    | extension                    | text                        | NO          | null                                            |
| realtime            | messages                    | payload                      | jsonb                       | YES         | null                                            |
| realtime            | messages                    | event                        | text                        | YES         | null                                            |
| realtime            | messages                    | private                      | boolean                     | YES         | false                                           |
| realtime            | messages                    | updated_at                   | timestamp without time zone | NO          | now()                                           |
| realtime            | messages                    | inserted_at                  | timestamp without time zone | NO          | now()                                           |
| realtime            | messages                    | id                           | uuid                        | NO          | gen_random_uuid()                               |
| realtime            | schema_migrations           | version                      | bigint                      | NO          | null                                            |
| realtime            | schema_migrations           | inserted_at                  | timestamp without time zone | YES         | null                                            |
| realtime            | subscription                | id                           | bigint                      | NO          | null                                            |
| realtime            | subscription                | subscription_id              | uuid                        | NO          | null                                            |
| realtime            | subscription                | entity                       | regclass                    | NO          | null                                            |
| realtime            | subscription                | filters                      | ARRAY                       | NO          | '{}'::realtime.user_defined_filter[]            |
| realtime            | subscription                | claims                       | jsonb                       | NO          | null                                            |
| realtime            | subscription                | claims_role                  | regrole                     | NO          | null                                            |
| realtime            | subscription                | created_at                   | timestamp without time zone | NO          | timezone('utc'::text, now())                    |
| storage             | buckets                     | id                           | text                        | NO          | null                                            |
| storage             | buckets                     | name                         | text                        | NO          | null                                            |
| storage             | buckets                     | owner                        | uuid                        | YES         | null                                            |
| storage             | buckets                     | created_at                   | timestamp with time zone    | YES         | now()                                           |
| storage             | buckets                     | updated_at                   | timestamp with time zone    | YES         | now()                                           |
| storage             | buckets                     | public                       | boolean                     | YES         | false                                           |
| storage             | buckets                     | avif_autodetection           | boolean                     | YES         | false                                           |
| storage             | buckets                     | file_size_limit              | bigint                      | YES         | null                                            |
| storage             | buckets                     | allowed_mime_types           | ARRAY                       | YES         | null                                            |
| storage             | buckets                     | owner_id                     | text                        | YES         | null                                            |
| storage             | buckets                     | type                         | USER-DEFINED                | NO          | 'STANDARD'::storage.buckettype                  |
| storage             | buckets_analytics           | name                         | text                        | NO          | null                                            |
| storage             | buckets_analytics           | type                         | USER-DEFINED                | NO          | 'ANALYTICS'::storage.buckettype                 |
| storage             | buckets_analytics           | format                       | text                        | NO          | 'ICEBERG'::text                                 |
| storage             | buckets_analytics           | created_at                   | timestamp with time zone    | NO          | now()                                           |
| storage             | buckets_analytics           | updated_at                   | timestamp with time zone    | NO          | now()                                           |
| storage             | buckets_analytics           | id                           | uuid                        | NO          | gen_random_uuid()                               |
| storage             | buckets_analytics           | deleted_at                   | timestamp with time zone    | YES         | null                                            |
| storage             | buckets_vectors             | id                           | text                        | NO          | null                                            |
| storage             | buckets_vectors             | type                         | USER-DEFINED                | NO          | 'VECTOR'::storage.buckettype                    |
| storage             | buckets_vectors             | created_at                   | timestamp with time zone    | NO          | now()                                           |
| storage             | buckets_vectors             | updated_at                   | timestamp with time zone    | NO          | now()                                           |
| storage             | migrations                  | id                           | integer                     | NO          | null                                            |
| storage             | migrations                  | name                         | character varying           | NO          | null                                            |
| storage             | migrations                  | hash                         | character varying           | NO          | null                                            |
| storage             | migrations                  | executed_at                  | timestamp without time zone | YES         | CURRENT_TIMESTAMP                               |
| storage             | objects                     | id                           | uuid                        | NO          | gen_random_uuid()                               |
| storage             | objects                     | bucket_id                    | text                        | YES         | null                                            |
| storage             | objects                     | name                         | text                        | YES         | null                                            |
| storage             | objects                     | owner                        | uuid                        | YES         | null                                            |
| storage             | objects                     | created_at                   | timestamp with time zone    | YES         | now()                                           |
| storage             | objects                     | updated_at                   | timestamp with time zone    | YES         | now()                                           |
| storage             | objects                     | last_accessed_at             | timestamp with time zone    | YES         | now()                                           |
| storage             | objects                     | metadata                     | jsonb                       | YES         | null                                            |
| storage             | objects                     | path_tokens                  | ARRAY                       | YES         | null                                            |
| storage             | objects                     | version                      | text                        | YES         | null                                            |
| storage             | objects                     | owner_id                     | text                        | YES         | null                                            |
| storage             | objects                     | user_metadata                | jsonb                       | YES         | null                                            |
| storage             | objects                     | level                        | integer                     | YES         | null                                            |
| storage             | prefixes                    | bucket_id                    | text                        | NO          | null                                            |
| storage             | prefixes                    | name                         | text                        | NO          | null                                            |
| storage             | prefixes                    | level                        | integer                     | NO          | null                                            |
| storage             | prefixes                    | created_at                   | timestamp with time zone    | YES         | now()                                           |
| storage             | prefixes                    | updated_at                   | timestamp with time zone    | YES         | now()                                           |
| storage             | s3_multipart_uploads        | id                           | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads        | in_progress_size             | bigint                      | NO          | 0                                               |
| storage             | s3_multipart_uploads        | upload_signature             | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads        | bucket_id                    | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads        | key                          | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads        | version                      | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads        | owner_id                     | text                        | YES         | null                                            |
| storage             | s3_multipart_uploads        | created_at                   | timestamp with time zone    | NO          | now()                                           |
| storage             | s3_multipart_uploads        | user_metadata                | jsonb                       | YES         | null                                            |
| storage             | s3_multipart_uploads_parts  | id                           | uuid                        | NO          | gen_random_uuid()                               |
| storage             | s3_multipart_uploads_parts  | upload_id                    | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads_parts  | size                         | bigint                      | NO          | 0                                               |
| storage             | s3_multipart_uploads_parts  | part_number                  | integer                     | NO          | null                                            |
| storage             | s3_multipart_uploads_parts  | bucket_id                    | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads_parts  | key                          | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads_parts  | etag                         | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads_parts  | owner_id                     | text                        | YES         | null                                            |
| storage             | s3_multipart_uploads_parts  | version                      | text                        | NO          | null                                            |
| storage             | s3_multipart_uploads_parts  | created_at                   | timestamp with time zone    | NO          | now()                                           |
| storage             | vector_indexes              | id                           | text                        | NO          | gen_random_uuid()                               |
| storage             | vector_indexes              | name                         | text                        | NO          | null                                            |
| storage             | vector_indexes              | bucket_id                    | text                        | NO          | null                                            |
| storage             | vector_indexes              | data_type                    | text                        | NO          | null                                            |
| storage             | vector_indexes              | dimension                    | integer                     | NO          | null                                            |
| storage             | vector_indexes              | distance_metric              | text                        | NO          | null                                            |
| storage             | vector_indexes              | metadata_configuration       | jsonb                       | YES         | null                                            |
| storage             | vector_indexes              | created_at                   | timestamp with time zone    | NO          | now()                                           |
| storage             | vector_indexes              | updated_at                   | timestamp with time zone    | NO          | now()                                           |
| supabase_migrations | schema_migrations           | version                      | text                        | NO          | null                                            |
| supabase_migrations | schema_migrations           | statements                   | ARRAY                       | YES         | null                                            |
| supabase_migrations | schema_migrations           | name                         | text                        | YES         | null                                            |
| supabase_migrations | schema_migrations           | created_by                   | text                        | YES         | null                                            |
| supabase_migrations | schema_migrations           | idempotency_key              | text                        | YES         | null                                            |
| supabase_migrations | schema_migrations           | rollback                     | ARRAY                       | YES         | null                                            |
| vault               | decrypted_secrets           | id                           | uuid                        | YES         | null                                            |
| vault               | decrypted_secrets           | name                         | text                        | YES         | null                                            |
| vault               | decrypted_secrets           | description                  | text                        | YES         | null                                            |
| vault               | decrypted_secrets           | secret                       | text                        | YES         | null                                            |
| vault               | decrypted_secrets           | decrypted_secret             | text                        | YES         | null                                            |
| vault               | decrypted_secrets           | key_id                       | uuid                        | YES         | null                                            |
| vault               | decrypted_secrets           | nonce                        | bytea                       | YES         | null                                            |
| vault               | decrypted_secrets           | created_at                   | timestamp with time zone    | YES         | null                                            |
| vault               | decrypted_secrets           | updated_at                   | timestamp with time zone    | YES         | null                                            |
| vault               | secrets                     | id                           | uuid                        | NO          | gen_random_uuid()                               |
| vault               | secrets                     | name                         | text                        | YES         | null                                            |
| vault               | secrets                     | description                  | text                        | NO          | ''::text                                        |
| vault               | secrets                     | secret                       | text                        | NO          | null                                            |
| vault               | secrets                     | key_id                       | uuid                        | YES         | null                                            |
| vault               | secrets                     | nonce                        | bytea                       | YES         | vault._crypto_aead_det_noncegen()               |
| vault               | secrets                     | created_at                   | timestamp with time zone    | NO          | CURRENT_TIMESTAMP                               |
| vault               | secrets                     | updated_at                   | timestamp with time zone    | NO          | CURRENT_TIMESTAMP                               |